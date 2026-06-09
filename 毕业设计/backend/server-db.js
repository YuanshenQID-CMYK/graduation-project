const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your_secret_key_2024';

// 数据库连接配置
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '200558',
    database: 'personnel_management'
});

// 连接数据库
db.connect((err) => {
    if (err) {
        console.error('❌ 数据库连接失败:', err);
        console.log('请检查:');
        console.log('1. MySQL 服务是否已启动');
        console.log('2. 密码是否正确');
        console.log('3. 数据库是否已创建');
        return;
    }
    console.log('✅ 数据库连接成功');
    
    // 创建用户表（如果不存在）
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            employee_id VARCHAR(20) UNIQUE NOT NULL,
            username VARCHAR(50) NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(20) NOT NULL,
            gender VARCHAR(10) DEFAULT '保密',
            role VARCHAR(20) DEFAULT 'user',
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    // 创建日志表（如果不存在）
    const createLogsTable = `
        CREATE TABLE IF NOT EXISTS operation_logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            username VARCHAR(50),
            operation VARCHAR(255),
            target_user VARCHAR(100),
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.query(createUsersTable);
    db.query(createLogsTable);
    
    // 检查并创建管理员账号
    db.query("SELECT * FROM users WHERE employee_id = 'ADMIN001'", (err, results) => {
        if (results.length === 0) {
            db.query(`
                INSERT INTO users (employee_id, username, password, email, phone, gender, role) 
                VALUES ('ADMIN001', '无常', '200558', 'admin@system.com', '13800000000', '男', 'admin')
            `);
            console.log('✅ 管理员账号创建成功');
        }
    });
    
    // 检查并创建测试用户
    db.query("SELECT * FROM users WHERE employee_id = 'EMP001'", (err, results) => {
        if (results.length === 0) {
            db.query(`
                INSERT INTO users (employee_id, username, password, email, phone, gender, role) 
                VALUES 
                ('EMP001', '张三', '123456', 'zhangsan@test.com', '13800000001', '男', 'user'),
                ('EMP002', '李四', '123456', 'lisi@test.com', '13800000002', '女', 'user'),
                ('EMP003', '王五', '123456', 'wangwu@test.com', '13800000003', '男', 'user')
            `);
            console.log('✅ 测试用户创建成功');
        }
    });
});

// ========== 认证中间件 ==========

// 验证Token中间件
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: '无效的认证令牌' });
    }
};

// 验证管理员权限中间件（普通用户和游客无法访问）
const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: '权限不足，只有管理员可以执行此操作' });
    }
    next();
};

// 测试路由
app.get('/api/test', (req, res) => {
    res.json({ message: '后端服务正常运行' });
});

// 注册（任何人都可以注册，只能注册普通用户）
app.post('/api/register', (req, res) => {
    const { employee_id, username, password, email, phone, gender } = req.body;
    
    if (!employee_id || !username || !password || !email || !phone) {
        return res.status(400).json({ message: '请填写所有必填字段' });
    }
    
    db.query('SELECT id FROM users WHERE employee_id = ?', [employee_id], (err, results) => {
        if (err) return res.status(500).json({ message: '服务器错误' });
        if (results.length > 0) return res.status(400).json({ message: '工号已存在' });
        
        db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
            if (err) return res.status(500).json({ message: '服务器错误' });
            if (results.length > 0) return res.status(400).json({ message: '邮箱已被注册' });
            
            db.query(
                'INSERT INTO users (employee_id, username, password, email, phone, gender, role, status) VALUES (?, ?, ?, ?, ?, ?, "user", "active")',
                [employee_id, username, password, email, phone, gender || '保密'],
                (err, result) => {
                    if (err) {
                        console.error('插入错误:', err);
                        return res.status(500).json({ message: '注册失败' });
                    }
                    
                    db.query(
                        'INSERT INTO operation_logs (user_id, username, operation, target_user) VALUES (?, ?, ?, ?)',
                        [result.insertId, username, '注册账号', username]
                    );
                    
                    res.json({ message: '注册成功', userId: result.insertId });
                }
            );
        });
    });
});

// 登录 - 支持工号、邮箱、姓名三种方式
app.post('/api/login', (req, res) => {
    const { loginId, password, roleType } = req.body;
    
    console.log('登录请求:', { loginId, roleType });
    
    // 游客登录
    if (roleType === 'guest') {
        const token = jwt.sign({ id: 0, username: '游客', role: 'guest', employee_id: 'GUEST' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ 
            token, 
            user: { id: 0, username: '游客', employee_id: 'GUEST', role: 'guest' } 
        });
    }
    
    // 查询用户 - 支持工号、邮箱、姓名三种方式
    db.query(
        `SELECT * FROM users WHERE 
            employee_id = ? OR 
            email = ? OR 
            username = ?
        LIMIT 1`,
        [loginId, loginId, loginId],
        (err, users) => {
            if (err) {
                console.error('查询错误:', err);
                return res.status(500).json({ message: '服务器错误' });
            }
            
            if (users.length === 0) {
                return res.status(401).json({ message: '账号不存在' });
            }
            
            const user = users[0];
            
            // 验证密码
            if (user.password !== password) {
                return res.status(401).json({ message: '密码错误' });
            }
            
            if (user.status === 'disabled') {
                return res.status(401).json({ message: '账号已被禁用' });
            }
            
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role, 
                    employee_id: user.employee_id,
                    email: user.email
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            // 记录登录日志
            db.query(
                'INSERT INTO operation_logs (user_id, username, operation, ip_address) VALUES (?, ?, ?, ?)',
                [user.id, user.username, '登录系统', req.ip || '127.0.0.1']
            );
            
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    employee_id: user.employee_id,
                    email: user.email,
                    phone: user.phone,
                    gender: user.gender,
                    role: user.role
                }
            });
        }
    );
});

// ========== 需要登录才能访问的接口（普通用户可访问）==========

// 获取当前用户信息（需要登录）
app.get('/api/user/me', verifyToken, (req, res) => {
    db.query(
        'SELECT id, employee_id, username, email, phone, gender, role, status, created_at FROM users WHERE id = ?',
        [req.user.id],
        (err, users) => {
            if (err) return res.status(500).json({ message: '服务器错误' });
            if (users.length === 0) return res.status(404).json({ message: '用户不存在' });
            res.json(users[0]);
        }
    );
});

// 获取用户列表（普通用户可查看，但无修改权限）
app.get('/api/admin/users', verifyToken, (req, res) => {
    db.query(
        'SELECT id, employee_id, username, email, phone, gender, role, status, created_at FROM users ORDER BY created_at DESC',
        (err, users) => {
            if (err) return res.status(500).json({ message: '服务器错误' });
            res.json(users);
        }
    );
});

// ========== 管理员专属接口（普通用户和游客无法访问）==========

// 修改用户角色（仅管理员）
app.put('/api/admin/users/:id/role', verifyToken, verifyAdmin, (req, res) => {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    // 不能修改自己的角色
    if (userId === req.user.id) {
        return res.status(403).json({ message: '不能修改自己的权限' });
    }
    
    db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId], (err) => {
        if (err) return res.status(500).json({ message: '修改失败' });
        
        // 记录操作日志
        db.query(
            'INSERT INTO operation_logs (user_id, username, operation, target_user) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.username, `修改用户权限为${role === 'admin' ? '管理员' : '普通用户'}`, `用户ID: ${userId}`]
        );
        
        res.json({ message: '权限修改成功' });
    });
});

// 删除用户（仅管理员）
app.delete('/api/admin/users/:id', verifyToken, verifyAdmin, (req, res) => {
    const userId = parseInt(req.params.id);
    
    // 不能删除自己
    if (userId === req.user.id) {
        return res.status(403).json({ message: '不能删除自己的账号' });
    }
    
    db.query('DELETE FROM users WHERE id = ?', [userId], (err) => {
        if (err) return res.status(500).json({ message: '删除失败' });
        
        // 记录操作日志
        db.query(
            'INSERT INTO operation_logs (user_id, username, operation, target_user) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.username, '删除用户', `用户ID: ${userId}`]
        );
        
        res.json({ message: '用户删除成功' });
    });
});

// 修改用户状态（仅管理员）
app.put('/api/admin/users/:id/status', verifyToken, verifyAdmin, (req, res) => {
    const userId = parseInt(req.params.id);
    const { status } = req.body;
    
    // 不能禁用自己
    if (userId === req.user.id && status === 'disabled') {
        return res.status(403).json({ message: '不能禁用自己' });
    }
    
    db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId], (err) => {
        if (err) return res.status(500).json({ message: '操作失败' });
        
        // 记录操作日志
        db.query(
            'INSERT INTO operation_logs (user_id, username, operation, target_user) VALUES (?, ?, ?, ?)',
            [req.user.id, req.user.username, `${status === 'active' ? '启用' : '禁用'}用户`, `用户ID: ${userId}`]
        );
        
        res.json({ message: `用户已${status === 'active' ? '启用' : '禁用'}` });
    });
});

// 获取操作日志（仅管理员）
app.get('/api/admin/logs', verifyToken, verifyAdmin, (req, res) => {
    db.query(
        'SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT 100',
        (err, logs) => {
            if (err) return res.status(500).json({ message: '服务器错误' });
            res.json(logs);
        }
    );
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 后端服务运行在 http://localhost:3000');
    console.log('========================================');
    console.log('🔑 登录方式: 工号 / 邮箱 / 姓名');
    console.log('');
    console.log('📋 权限说明:');
    console.log('   管理员: 可以修改用户权限、删除用户、禁用用户');
    console.log('   普通用户: 只能查看用户列表，无修改权限');
    console.log('   游客: 只能浏览公开信息');
    console.log('');
    // console.log('📋 测试账号:');
    // console.log('   管理员: 无常 / 密码 200558');
    // console.log('   普通用户: 张三 / 密码 123456');
    // console.log('   普通用户: 李四 / 密码 123456');
    // console.log('   游客: 直接点击游客按钮');
    console.log('========================================');
});