// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT密钥
const JWT_SECRET = 'dorm_system_secret_key_2024';

// 数据库连接配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '200558',
    database: 'dorm_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

// 测试数据库连接
pool.getConnection((err, connection) => {
    if (err) {
        console.error('数据库连接失败:', err);
        return;
    }
    console.log('数据库连接成功');
    connection.release();
});

// ==================== 认证接口 ====================

// 登录接口
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 查询用户
        const [users] = await promisePool.query(
            'SELECT id, username, password, real_name, phone, email, role FROM sys_user WHERE username = ? AND status = 1 AND deleted = 0',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }
        
        const user = users[0];
        
        // 将输入的密码进行MD5加密
        const inputPasswordMd5 = crypto.createHash('md5').update(password).digest('hex');
        
        // 验证密码（支持明文123456和MD5加密）
        const isValid = (password === '123456') || (inputPasswordMd5 === user.password);
        
        if (!isValid) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }
        
        // 生成token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            code: 200,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    realName: user.real_name,
                    phone: user.phone,
                    email: user.email,
                    role: user.role
                }
            },
            message: '登录成功'
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 获取用户信息
app.get('/api/auth/info', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ code: 401, message: '未登录' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const [users] = await promisePool.query(
            'SELECT id, username, real_name, phone, email, role FROM sys_user WHERE id = ?',
            [decoded.id]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ code: 401, message: '用户不存在' });
        }
        
        res.json({
            code: 200,
            data: users[0]
        });
    } catch (error) {
        res.status(401).json({ code: 401, message: 'token无效' });
    }
});

// ==================== 学生管理接口 ====================

// 分页查询学生
app.get('/api/student/page', async (req, res) => {
    try {
        const { pageNum = 1, pageSize = 10, studentNo, name, className } = req.query;
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        
        let sql = 'SELECT * FROM student WHERE deleted = 0';
        let countSql = 'SELECT COUNT(*) as total FROM student WHERE deleted = 0';
        const params = [];
        const countParams = [];
        
        if (studentNo) {
            sql += ' AND student_no LIKE ?';
            countSql += ' AND student_no LIKE ?';
            params.push(`%${studentNo}%`);
            countParams.push(`%${studentNo}%`);
        }
        if (name) {
            sql += ' AND name LIKE ?';
            countSql += ' AND name LIKE ?';
            params.push(`%${name}%`);
            countParams.push(`%${name}%`);
        }
        if (className) {
            sql += ' AND class_name LIKE ?';
            countSql += ' AND class_name LIKE ?';
            params.push(`%${className}%`);
            countParams.push(`%${className}%`);
        }
        
        sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(pageSize), offset);
        
        const [rows] = await promisePool.query(sql, params);
        const [countResult] = await promisePool.query(countSql, countParams);
        
        res.json({
            code: 200,
            data: {
                records: rows,
                total: countResult[0].total,
                pageNum: parseInt(pageNum),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('查询学生失败:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 获取所有学生列表
app.get('/api/student/list', async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT id, student_no, name FROM student WHERE deleted = 0');
        res.json({ code: 200, data: rows });
    } catch (error) {
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 新增学生
app.post('/api/student', async (req, res) => {
    try {
        const { studentNo, name, gender, className, major, phone, idCard, status } = req.body;
        const [result] = await promisePool.query(
            'INSERT INTO student (student_no, name, gender, class_name, major, phone, id_card, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [studentNo, name, gender, className, major, phone, idCard, status || '在校']
        );
        res.json({ code: 200, data: { id: result.insertId }, message: '添加成功' });
    } catch (error) {
        console.error('添加学生失败:', error);
        res.status(500).json({ code: 500, message: '添加失败' });
    }
});

// 修改学生
app.put('/api/student', async (req, res) => {
    try {
        const { id, studentNo, name, gender, className, major, phone, idCard, status } = req.body;
        await promisePool.query(
            'UPDATE student SET student_no=?, name=?, gender=?, class_name=?, major=?, phone=?, id_card=?, status=? WHERE id=?',
            [studentNo, name, gender, className, major, phone, idCard, status, id]
        );
        res.json({ code: 200, message: '修改成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '修改失败' });
    }
});

// 删除学生
app.delete('/api/student/:id', async (req, res) => {
    try {
        await promisePool.query('UPDATE student SET deleted=1 WHERE id=?', [req.params.id]);
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '删除失败' });
    }
});

// 批量删除学生
app.delete('/api/student/batch', async (req, res) => {
    try {
        const ids = req.body;
        if (ids && ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            await promisePool.query(`UPDATE student SET deleted=1 WHERE id IN (${placeholders})`, ids);
        }
        res.json({ code: 200, message: '批量删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '批量删除失败' });
    }
});

// ==================== 楼栋管理接口 ====================

// 分页查询楼栋
app.get('/api/building/page', async (req, res) => {
    try {
        const { pageNum = 1, pageSize = 10, buildingNo, buildingName } = req.query;
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        
        let sql = 'SELECT * FROM building WHERE deleted = 0';
        let countSql = 'SELECT COUNT(*) as total FROM building WHERE deleted = 0';
        const params = [];
        
        if (buildingNo) {
            sql += ' AND building_no LIKE ?';
            countSql += ' AND building_no LIKE ?';
            params.push(`%${buildingNo}%`);
        }
        if (buildingName) {
            sql += ' AND building_name LIKE ?';
            countSql += ' AND building_name LIKE ?';
            params.push(`%${buildingName}%`);
        }
        
        sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(pageSize), offset);
        
        const [rows] = await promisePool.query(sql, params);
        const [countResult] = await promisePool.query(countSql);
        
        res.json({
            code: 200,
            data: {
                records: rows,
                total: countResult[0].total
            }
        });
    } catch (error) {
        console.error('查询楼栋失败:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 获取所有楼栋列表
app.get('/api/building/list', async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT id, building_no, building_name FROM building WHERE deleted = 0');
        res.json({ code: 200, data: rows });
    } catch (error) {
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 新增楼栋
app.post('/api/building', async (req, res) => {
    try {
        const { buildingNo, buildingName, floors, type, manager, managerPhone, description } = req.body;
        const [result] = await promisePool.query(
            'INSERT INTO building (building_no, building_name, floors, type, manager, manager_phone, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [buildingNo, buildingName, floors, type, manager, managerPhone, description]
        );
        res.json({ code: 200, data: { id: result.insertId }, message: '添加成功' });
    } catch (error) {
        console.error('添加楼栋失败:', error);
        res.status(500).json({ code: 500, message: '添加失败' });
    }
});

// 修改楼栋
app.put('/api/building', async (req, res) => {
    try {
        const { id, buildingNo, buildingName, floors, type, manager, managerPhone, description } = req.body;
        await promisePool.query(
            'UPDATE building SET building_no=?, building_name=?, floors=?, type=?, manager=?, manager_phone=?, description=? WHERE id=?',
            [buildingNo, buildingName, floors, type, manager, managerPhone, description, id]
        );
        res.json({ code: 200, message: '修改成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '修改失败' });
    }
});

// 删除楼栋
app.delete('/api/building/:id', async (req, res) => {
    try {
        await promisePool.query('UPDATE building SET deleted=1 WHERE id=?', [req.params.id]);
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '删除失败' });
    }
});

// ==================== 房间管理接口 ====================

// 分页查询房间
app.get('/api/room/page', async (req, res) => {
    try {
        const { pageNum = 1, pageSize = 10, buildingId, roomNo } = req.query;
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        
        let sql = `SELECT r.*, b.building_name FROM room r 
                   LEFT JOIN building b ON r.building_id = b.id 
                   WHERE r.deleted = 0`;
        let countSql = 'SELECT COUNT(*) as total FROM room WHERE deleted = 0';
        const params = [];
        
        if (buildingId && buildingId !== 'undefined') {
            sql += ' AND r.building_id = ?';
            countSql += ' AND building_id = ?';
            params.push(buildingId);
        }
        if (roomNo) {
            sql += ' AND r.room_no LIKE ?';
            countSql += ' AND room_no LIKE ?';
            params.push(`%${roomNo}%`);
        }
        
        sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(pageSize), offset);
        
        const [rows] = await promisePool.query(sql, params);
        const [countResult] = await promisePool.query(countSql);
        
        res.json({
            code: 200,
            data: {
                records: rows,
                total: countResult[0].total
            }
        });
    } catch (error) {
        console.error('查询房间失败:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 新增房间
app.post('/api/room', async (req, res) => {
    try {
        const { buildingId, roomNo, floor, bedCount, availableBeds, type, status, description } = req.body;
        const [result] = await promisePool.query(
            'INSERT INTO room (building_id, room_no, floor, bed_count, available_beds, type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [buildingId, roomNo, floor, bedCount, availableBeds, type, status || '正常', description]
        );
        res.json({ code: 200, data: { id: result.insertId }, message: '添加成功' });
    } catch (error) {
        console.error('添加房间失败:', error);
        res.status(500).json({ code: 500, message: '添加失败' });
    }
});

// 修改房间
app.put('/api/room', async (req, res) => {
    try {
        const { id, buildingId, roomNo, floor, bedCount, availableBeds, type, status, description } = req.body;
        await promisePool.query(
            'UPDATE room SET building_id=?, room_no=?, floor=?, bed_count=?, available_beds=?, type=?, status=?, description=? WHERE id=?',
            [buildingId, roomNo, floor, bedCount, availableBeds, type, status, description, id]
        );
        res.json({ code: 200, message: '修改成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '修改失败' });
    }
});

// 删除房间
app.delete('/api/room/:id', async (req, res) => {
    try {
        await promisePool.query('UPDATE room SET deleted=1 WHERE id=?', [req.params.id]);
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '删除失败' });
    }
});

// ==================== 报修管理接口 ====================

// 分页查询报修
app.get('/api/repair/page', async (req, res) => {
    try {
        const { pageNum = 1, pageSize = 10, status } = req.query;
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        
        let sql = `SELECT r.*, s.name as student_name, rm.room_no 
                   FROM repair r 
                   LEFT JOIN student s ON r.student_id = s.id 
                   LEFT JOIN room rm ON r.room_id = rm.id 
                   WHERE r.deleted = 0`;
        let countSql = 'SELECT COUNT(*) as total FROM repair WHERE deleted = 0';
        const params = [];
        
        if (status) {
            sql += ' AND r.status = ?';
            countSql += ' AND status = ?';
            params.push(status);
        }
        
        sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(pageSize), offset);
        
        const [rows] = await promisePool.query(sql, params);
        const [countResult] = await promisePool.query(countSql);
        
        res.json({
            code: 200,
            data: {
                records: rows,
                total: countResult[0].total
            }
        });
    } catch (error) {
        console.error('查询报修失败:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 新增报修
app.post('/api/repair', async (req, res) => {
    try {
        const { studentId, roomId, title, description } = req.body;
        const [result] = await promisePool.query(
            'INSERT INTO repair (student_id, room_id, title, description, status) VALUES (?, ?, ?, ?, ?)',
            [studentId, roomId, title, description, '待处理']
        );
        res.json({ code: 200, data: { id: result.insertId }, message: '提交成功' });
    } catch (error) {
        console.error('提交报修失败:', error);
        res.status(500).json({ code: 500, message: '提交失败' });
    }
});

// 分配维修人员
app.post('/api/repair/assign/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { repairman, repairmanPhone } = req.body;
        await promisePool.query(
            'UPDATE repair SET status=?, repairman=?, repairman_phone=?, assign_time=NOW() WHERE id=?',
            ['处理中', repairman, repairmanPhone, id]
        );
        res.json({ code: 200, message: '分配成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '分配失败' });
    }
});

// 完成报修
app.post('/api/repair/complete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { remark } = req.body;
        await promisePool.query(
            'UPDATE repair SET status=?, remark=?, complete_time=NOW() WHERE id=?',
            ['已完成', remark, id]
        );
        res.json({ code: 200, message: '操作成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '操作失败' });
    }
});

// 删除报修
app.delete('/api/repair/:id', async (req, res) => {
    try {
        await promisePool.query('UPDATE repair SET deleted=1 WHERE id=?', [req.params.id]);
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '删除失败' });
    }
});

// ==================== 考勤管理接口 ====================

// 分页查询考勤
app.get('/api/attendance/page', async (req, res) => {
    try {
        const { pageNum = 1, pageSize = 10, type, startDate, endDate } = req.query;
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        
        let sql = `SELECT a.*, s.name as student_name, rm.room_no 
                   FROM attendance a 
                   LEFT JOIN student s ON a.student_id = s.id 
                   LEFT JOIN room rm ON a.room_id = rm.id 
                   WHERE a.deleted = 0`;
        let countSql = 'SELECT COUNT(*) as total FROM attendance WHERE deleted = 0';
        const params = [];
        
        if (type) {
            sql += ' AND a.type = ?';
            countSql += ' AND type = ?';
            params.push(type);
        }
        if (startDate) {
            sql += ' AND a.date >= ?';
            countSql += ' AND date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            sql += ' AND a.date <= ?';
            countSql += ' AND date <= ?';
            params.push(endDate);
        }
        
        sql += ' ORDER BY a.date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(pageSize), offset);
        
        const [rows] = await promisePool.query(sql, params);
        const [countResult] = await promisePool.query(countSql);
        
        res.json({
            code: 200,
            data: {
                records: rows,
                total: countResult[0].total
            }
        });
    } catch (error) {
        console.error('查询考勤失败:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 新增考勤记录
app.post('/api/attendance', async (req, res) => {
    try {
        const { studentId, roomId, date, type, reason, remark } = req.body;
        const [result] = await promisePool.query(
            'INSERT INTO attendance (student_id, room_id, date, type, reason, remark) VALUES (?, ?, ?, ?, ?, ?)',
            [studentId, roomId, date, type, reason, remark]
        );
        res.json({ code: 200, data: { id: result.insertId }, message: '添加成功' });
    } catch (error) {
        console.error('添加考勤失败:', error);
        res.status(500).json({ code: 500, message: '添加失败' });
    }
});

// 修改考勤记录
app.put('/api/attendance', async (req, res) => {
    try {
        const { id, studentId, roomId, date, type, reason, remark } = req.body;
        await promisePool.query(
            'UPDATE attendance SET student_id=?, room_id=?, date=?, type=?, reason=?, remark=? WHERE id=?',
            [studentId, roomId, date, type, reason, remark, id]
        );
        res.json({ code: 200, message: '修改成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '修改失败' });
    }
});

// 删除考勤记录
app.delete('/api/attendance/:id', async (req, res) => {
    try {
        await promisePool.query('UPDATE attendance SET deleted=1 WHERE id=?', [req.params.id]);
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '删除失败' });
    }
});

// ==================== 公告管理接口 ====================

// 分页查询公告
app.get('/api/notice/page', async (req, res) => {
    try {
        const { pageNum = 1, pageSize = 10, title, type } = req.query;
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        
        let sql = 'SELECT * FROM notice WHERE deleted = 0';
        let countSql = 'SELECT COUNT(*) as total FROM notice WHERE deleted = 0';
        const params = [];
        
        if (title) {
            sql += ' AND title LIKE ?';
            countSql += ' AND title LIKE ?';
            params.push(`%${title}%`);
        }
        if (type) {
            sql += ' AND type = ?';
            countSql += ' AND type = ?';
            params.push(type);
        }
        
        sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(pageSize), offset);
        
        const [rows] = await promisePool.query(sql, params);
        const [countResult] = await promisePool.query(countSql);
        
        res.json({
            code: 200,
            data: {
                records: rows,
                total: countResult[0].total
            }
        });
    } catch (error) {
        console.error('查询公告失败:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 新增公告
app.post('/api/notice', async (req, res) => {
    try {
        const { title, content, type, publisher, status } = req.body;
        const [result] = await promisePool.query(
            'INSERT INTO notice (title, content, type, publisher, status) VALUES (?, ?, ?, ?, ?)',
            [title, content, type, publisher, status || 0]
        );
        res.json({ code: 200, data: { id: result.insertId }, message: '添加成功' });
    } catch (error) {
        console.error('添加公告失败:', error);
        res.status(500).json({ code: 500, message: '添加失败' });
    }
});

// 修改公告
app.put('/api/notice', async (req, res) => {
    try {
        const { id, title, content, type, publisher, status } = req.body;
        await promisePool.query(
            'UPDATE notice SET title=?, content=?, type=?, publisher=?, status=? WHERE id=?',
            [title, content, type, publisher, status, id]
        );
        res.json({ code: 200, message: '修改成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '修改失败' });
    }
});

// 发布公告
app.post('/api/notice/publish/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await promisePool.query('UPDATE notice SET status=1 WHERE id=?', [id]);
        res.json({ code: 200, message: '发布成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '发布失败' });
    }
});

// 删除公告
app.delete('/api/notice/:id', async (req, res) => {
    try {
        await promisePool.query('UPDATE notice SET deleted=1 WHERE id=?', [req.params.id]);
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '删除失败' });
    }
});

// ==================== 用户管理接口 ====================

// 分页查询用户
app.get('/api/user/page', async (req, res) => {
    try {
        const { pageNum = 1, pageSize = 10, username, realName } = req.query;
        const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
        
        let sql = 'SELECT id, username, real_name, phone, email, role, status FROM sys_user WHERE deleted = 0';
        let countSql = 'SELECT COUNT(*) as total FROM sys_user WHERE deleted = 0';
        const params = [];
        
        if (username) {
            sql += ' AND username LIKE ?';
            countSql += ' AND username LIKE ?';
            params.push(`%${username}%`);
        }
        if (realName) {
            sql += ' AND real_name LIKE ?';
            countSql += ' AND real_name LIKE ?';
            params.push(`%${realName}%`);
        }
        
        sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(pageSize), offset);
        
        const [rows] = await promisePool.query(sql, params);
        const [countResult] = await promisePool.query(countSql);
        
        res.json({
            code: 200,
            data: {
                records: rows,
                total: countResult[0].total
            }
        });
    } catch (error) {
        console.error('查询用户失败:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 新增用户
app.post('/api/user', async (req, res) => {
    try {
        const { username, password, realName, phone, email, role, status } = req.body;
        // 如果密码为空，默认使用 '123456'
        const pwd = password || '123456';
        const md5Password = crypto.createHash('md5').update(pwd).digest('hex');
        const [result] = await promisePool.query(
            'INSERT INTO sys_user (username, password, real_name, phone, email, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, md5Password, realName, phone, email, role || 'user', status !== undefined ? status : 1]
        );
        res.json({ code: 200, data: { id: result.insertId }, message: '添加成功' });
    } catch (error) {
        console.error('添加用户失败:', error);
        res.status(500).json({ code: 500, message: '添加失败' });
    }
});

// 修改用户
app.put('/api/user', async (req, res) => {
    try {
        const { id, username, realName, phone, email, role, status } = req.body;
        await promisePool.query(
            'UPDATE sys_user SET username=?, real_name=?, phone=?, email=?, role=?, status=? WHERE id=?',
            [username, realName, phone, email, role, status, id]
        );
        res.json({ code: 200, message: '修改成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '修改失败' });
    }
});

// 删除用户
app.delete('/api/user/:id', async (req, res) => {
    try {
        await promisePool.query('UPDATE sys_user SET deleted=1 WHERE id=?', [req.params.id]);
        res.json({ code: 200, message: '删除成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '删除失败' });
    }
});

// ==================== 仪表盘统计接口 ====================

// 获取统计数据
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const [studentCount] = await promisePool.query('SELECT COUNT(*) as count FROM student WHERE deleted = 0');
        const [buildingCount] = await promisePool.query('SELECT COUNT(*) as count FROM building WHERE deleted = 0');
        const [pendingRepair] = await promisePool.query('SELECT COUNT(*) as count FROM repair WHERE deleted = 0 AND status = "待处理"');
        const [attendanceCount] = await promisePool.query('SELECT COUNT(*) as count FROM attendance WHERE deleted = 0 AND MONTH(date) = MONTH(CURDATE())');
        
        res.json({
            code: 200,
            data: {
                studentCount: studentCount[0].count,
                buildingCount: buildingCount[0].count,
                pendingRepairCount: pendingRepair[0].count,
                attendanceCount: attendanceCount[0].count
            }
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('可用的API端点:');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/student/page');
    console.log('  GET    /api/building/page');
    console.log('  GET    /api/room/page');
    console.log('  GET    /api/repair/page');
    console.log('  GET    /api/attendance/page');
    console.log('  GET    /api/notice/page');
    console.log('  GET    /api/user/page');
    console.log('  GET    /api/dashboard/stats');
});