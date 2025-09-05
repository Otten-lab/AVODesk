const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true, // Разрешает запросы с любых доменов
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? {
        rejectUnauthorized: false
    } : false
});

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create stages table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stages (
                id SERIAL PRIMARY KEY,
                number INTEGER,
                name TEXT,
                icon TEXT,
                weeks TEXT,
                hours INTEGER,
                cost INTEGER,
                status TEXT,
                brief TEXT,
                description TEXT,
                progress INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create tasks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                stage_id INTEGER REFERENCES stages(id) ON DELETE CASCADE,
                text TEXT,
                completed BOOLEAN DEFAULT false,
                position INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_stage_status ON stages(status)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_task_stage ON tasks(stage_id)`);
        
        // Check if data exists
        const result = await pool.query('SELECT COUNT(*) as count FROM stages');
        const count = parseInt(result.rows[0].count);
        
        if (count === 0) {
            console.log('Initializing database with default data...');
            await initializeDefaultData();
        } else {
            console.log(`Database contains ${count} stages`);
        }
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

// Initialize default data
async function initializeDefaultData() {
    const defaultStages = [
        {
            number: 1,
            name: 'Архитектура + базовое AI-ядро',
            icon: '🏗️',
            weeks: 'Недели 1-3',
            hours: 160,
            cost: 383000,
            status: 'complete',
            progress: 100,
            brief: 'Спроектирован сервис, готово ядро NLP-анализа',
            description: 'Разработана полная архитектура системы и реализовано базовое AI-ядро для обработки тендерной документации.',
            tasks: [
                {text: 'Спроектирована модульная архитектура системы', completed: true},
                {text: 'Настроена интеграция с OpenAI GPT-4', completed: true},
                {text: 'Реализовано ядро NLP-анализа документов', completed: true},
                {text: 'Создана база знаний по 44-ФЗ/223-ФЗ', completed: true},
                {text: 'Настроена обработка естественного языка', completed: true}
            ]
        },
        {
            number: 2,
            name: 'Модуль анализа закупки',
            icon: '🔍',
            weeks: 'Недели 3-4',
            hours: 80,
            cost: 191000,
            status: 'progress',
            progress: 85,
            brief: 'Парсер извещений, формирование структуры данных закупки',
            description: 'Модуль для автоматического анализа закупочной документации и извлечения ключевых параметров.',
            tasks: [
                {text: 'Реализован парсер извещений о закупках', completed: true},
                {text: 'Настроено извлечение требований из документации', completed: true},
                {text: 'Создана структура данных для хранения информации о закупке', completed: true},
                {text: 'Реализован анализ критериев оценки заявок', completed: true},
                {text: 'Доработать алгоритм оценки рисков', completed: false},
                {text: 'Улучшить точность извлечения сроков', completed: false}
            ]
        },
        {
            number: 3,
            name: 'Интеграции (ЕИС, платежи, Telegram)',
            icon: '🔗',
            weeks: 'Недели 5-6',
            hours: 160,
            cost: 363000,
            status: 'progress',
            progress: 60,
            brief: 'Подключены внешние API, кэширование и обработка ошибок',
            description: 'Интеграция с государственными системами и внешними сервисами.',
            tasks: [
                {text: 'Реализована интеграция с SOAP API ЕИС', completed: true},
                {text: 'Настроено получение данных о закупках', completed: true},
                {text: 'Реализовано кэширование данных', completed: true},
                {text: 'Настроена обработка ошибок API', completed: true},
                {text: 'Интегрировать платежный шлюз ЮKassa', completed: false},
                {text: 'Подключить Telegram Bot API', completed: false},
                {text: 'Настроить email-рассылку', completed: false},
                {text: 'Реализовать SMS-уведомления', completed: false}
            ]
        },
        {
            number: 4,
            name: 'Интерфейс (кабинет + админ-панель)',
            icon: '💻',
            weeks: 'Недели 7-8',
            hours: 136,
            cost: 268000,
            status: 'progress',
            progress: 70,
            brief: 'Адаптивный веб-UI, формы, навигация',
            description: 'Разработка пользовательского интерфейса и административной панели.',
            tasks: [
                {text: 'Создан адаптивный дизайн интерфейса', completed: true},
                {text: 'Реализована система навигации', completed: true},
                {text: 'Разработаны основные формы ввода', completed: true},
                {text: 'Создан личный кабинет пользователя', completed: true},
                {text: 'Реализована часть админ-панели', completed: true},
                {text: 'Доработать раздел статистики', completed: false},
                {text: 'Завершить панель супер-администратора', completed: false},
                {text: 'Добавить раздел маркетинговой аналитики', completed: false}
            ]
        },
        {
            number: 5,
            name: 'Чат-бот (LLM + Telegram)',
            icon: '💬',
            weeks: 'Недели 8-9',
            hours: 64,
            cost: 142000,
            status: 'pending',
            progress: 0,
            brief: 'Диалог <5 с, привязка аккаунта',
            description: 'Интеллектуальный чат-бот для консультаций и поддержки пользователей.',
            tasks: [
                {text: 'Разработать архитектуру чат-бота', completed: false},
                {text: 'Реализовать NLP-обработку запросов', completed: false},
                {text: 'Настроить WebSocket для веб-версии', completed: false},
                {text: 'Интегрировать Telegram Bot API', completed: false},
                {text: 'Реализовать привязку аккаунтов', completed: false},
                {text: 'Обучить модель на FAQ', completed: false}
            ]
        },
        {
            number: 6,
            name: 'PDF-экспорт документов',
            icon: '📄',
            weeks: 'Неделя 9',
            hours: 24,
            cost: 57000,
            status: 'progress',
            progress: 75,
            brief: 'Генерация DOCX/XLSX/PDF из шаблонов',
            description: 'Модуль экспорта готовых документов в различных форматах.',
            tasks: [
                {text: 'Реализована генерация DOCX документов', completed: true},
                {text: 'Настроен экспорт в XLSX', completed: true},
                {text: 'Создана система шаблонов', completed: true},
                {text: 'Доработать генерацию PDF', completed: false},
                {text: 'Оптимизировать качество экспорта', completed: false}
            ]
        },
        {
            number: 7,
            name: 'Тестирование и отладка',
            icon: '🧪',
            weeks: 'Недели 10-11',
            hours: 112,
            cost: 216000,
            status: 'testing',
            progress: 15,
            brief: 'Юнит-/интеграционное тестирование, отчёт о дефектах',
            description: 'Комплексное тестирование системы и исправление обнаруженных ошибок.',
            tasks: [
                {text: 'Написаны базовые юнит-тесты', completed: true},
                {text: 'Настроено окружение для тестирования', completed: true},
                {text: 'Провести полное функциональное тестирование', completed: false},
                {text: 'Выполнить нагрузочное тестирование', completed: false},
                {text: 'Провести тестирование безопасности', completed: false},
                {text: 'Интеграционное тестирование всех модулей', completed: false},
                {text: 'Составить отчет о дефектах', completed: false}
            ]
        },
        {
            number: 8,
            name: 'Инфраструктура и деплой',
            icon: '🚀',
            weeks: 'Неделя 12',
            hours: 40,
            cost: 80000,
            status: 'pending',
            progress: 0,
            brief: 'Автоматический деплой, мониторинг, бэкапы',
            description: 'Настройка CI/CD процессов и развертывание на продакшн.',
            tasks: [
                {text: 'Настроить CI/CD pipeline', completed: false},
                {text: 'Развернуть на продакшн сервере', completed: false},
                {text: 'Настроить мониторинг и алерты', completed: false},
                {text: 'Реализовать автоматическое резервное копирование', completed: false},
                {text: 'Настроить балансировку нагрузки', completed: false},
                {text: 'Документировать процессы DevOps', completed: false}
            ]
        }
    ];

    try {
        for (const stage of defaultStages) {
            const stageResult = await pool.query(`
                INSERT INTO stages (number, name, icon, weeks, hours, cost, status, brief, description, progress)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `, [stage.number, stage.name, stage.icon, stage.weeks, stage.hours, 
                stage.cost, stage.status, stage.brief, stage.description, stage.progress]);
            
            const stageId = stageResult.rows[0].id;
            
            for (let i = 0; i < stage.tasks.length; i++) {
                const task = stage.tasks[i];
                await pool.query(`
                    INSERT INTO tasks (stage_id, text, completed, position)
                    VALUES ($1, $2, $3, $4)
                `, [stageId, task.text, task.completed, i]);
            }
        }
        console.log('Default data initialized successfully');
    } catch (err) {
        console.error('Error initializing default data:', err);
    }
}

// API Routes

// Get all stages with tasks
app.get('/api/stages', async (req, res) => {
    try {
        const stagesResult = await pool.query('SELECT * FROM stages ORDER BY number');
        const stages = stagesResult.rows;
        
        for (const stage of stages) {
            const tasksResult = await pool.query(
                'SELECT * FROM tasks WHERE stage_id = $1 ORDER BY position, id',
                [stage.id]
            );
            stage.tasks = tasksResult.rows.map(t => ({
                id: t.id,
                text: t.text,
                completed: t.completed
            }));
        }
        
        res.json(stages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new stage
app.post('/api/stages', async (req, res) => {
    const { name, icon, weeks, hours, cost, brief, description, tasks } = req.body;
    
    try {
        // Get max stage number
        const maxResult = await pool.query('SELECT MAX(number) as max_num FROM stages');
        const number = (maxResult.rows[0].max_num || 0) + 1;
        
        const stageResult = await pool.query(`
            INSERT INTO stages (number, name, icon, weeks, hours, cost, status, brief, description, progress)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, 0)
            RETURNING *
        `, [number, name, icon || '📋', weeks, hours, cost, brief, description]);
        
        const stage = stageResult.rows[0];
        
        // Add tasks if provided
        if (tasks && tasks.length > 0) {
            for (let i = 0; i < tasks.length; i++) {
                await pool.query(`
                    INSERT INTO tasks (stage_id, text, completed, position)
                    VALUES ($1, $2, false, $3)
                `, [stage.id, tasks[i], i]);
            }
        }
        
        res.json(stage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update stage
app.put('/api/stages/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
            setClause.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
        }
    }
    
    if (setClause.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    try {
        const result = await pool.query(`
            UPDATE stages 
            SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
        `, values);
        
        res.json({ success: true, changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete stage
app.delete('/api/stages/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.query('BEGIN');
        
        // Delete tasks first (CASCADE should handle this, but being explicit)
        await pool.query('DELETE FROM tasks WHERE stage_id = $1', [id]);
        
        // Delete the stage
        const result = await pool.query('DELETE FROM stages WHERE id = $1', [id]);
        
        // Renumber remaining stages
        await pool.query(`
            UPDATE stages 
            SET number = subquery.new_number
            FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY number) as new_number
                FROM stages
            ) as subquery
            WHERE stages.id = subquery.id
        `);
        
        await pool.query('COMMIT');
        res.json({ success: true, changes: result.rowCount });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Add task
app.post('/api/stages/:stageId/tasks', async (req, res) => {
    const { stageId } = req.params;
    const { text } = req.body;
    
    try {
        const maxResult = await pool.query(
            'SELECT MAX(position) as max_pos FROM tasks WHERE stage_id = $1',
            [stageId]
        );
        const position = (maxResult.rows[0].max_pos !== null ? maxResult.rows[0].max_pos : -1) + 1;
        
        const result = await pool.query(`
            INSERT INTO tasks (stage_id, text, completed, position)
            VALUES ($1, $2, false, $3)
            RETURNING *
        `, [stageId, text, position]);
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle task
app.put('/api/tasks/:id/toggle', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(`
            UPDATE tasks 
            SET completed = NOT completed
            WHERE id = $1
            RETURNING *
        `, [id]);
        
        res.json({ 
            success: true, 
            completed: result.rows[0].completed 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.json({ success: true, changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update task text
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    
    try {
        await pool.query(`
            UPDATE tasks 
            SET text = $1
            WHERE id = $2
        `, [text, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_stages,
                SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'testing' THEN 1 ELSE 0 END) as testing,
                AVG(progress) as avg_progress,
                SUM(hours * progress / 100.0) as hours_worked,
                SUM(hours) as total_hours
            FROM stages
        `);
        
        const taskStatsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_tasks
            FROM tasks
        `);
        
        res.json({
            ...statsResult.rows[0],
            ...taskStatsResult.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export data
app.get('/api/export', async (req, res) => {
    try {
        const stagesResult = await pool.query('SELECT * FROM stages ORDER BY number');
        const stages = stagesResult.rows;
        
        const exportData = [];
        
        for (const stage of stages) {
            const tasksResult = await pool.query(
                'SELECT text, completed FROM tasks WHERE stage_id = $1 ORDER BY position, id',
                [stage.id]
            );
            
            exportData.push({
                number: stage.number,
                name: stage.name,
                icon: stage.icon,
                weeks: stage.weeks,
                hours: stage.hours,
                cost: stage.cost,
                status: stage.status,
                brief: stage.brief,
                description: stage.description,
                progress: stage.progress,
                tasks: tasksResult.rows.map(t => ({
                    text: t.text,
                    completed: t.completed
                }))
            });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="project_stages.json"');
        res.json(exportData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Import data
app.post('/api/import', async (req, res) => {
    const stages = req.body;
    
    if (!Array.isArray(stages)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }
    
    try {
        await pool.query('BEGIN');
        
        // Clear existing data
        await pool.query('DELETE FROM tasks');
        await pool.query('DELETE FROM stages');
        
        for (const stage of stages) {
            const stageResult = await pool.query(`
                INSERT INTO stages (number, name, icon, weeks, hours, cost, status, brief, description, progress)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `, [stage.number, stage.name, stage.icon, stage.weeks, stage.hours,
                stage.cost, stage.status, stage.brief, stage.description, stage.progress || 0]);
            
            const stageId = stageResult.rows[0].id;
            
            if (stage.tasks && stage.tasks.length > 0) {
                for (let i = 0; i < stage.tasks.length; i++) {
                    const task = stage.tasks[i];
                    await pool.query(`
                        INSERT INTO tasks (stage_id, text, completed, position)
                        VALUES ($1, $2, $3, $4)
                    `, [stageId, task.text, task.completed, i]);
                }
            }
        }
        
        await pool.query('COMMIT');
        res.json({ success: true, imported: stages.length });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Reset to default data
app.post('/api/reset', async (req, res) => {
    try {
        await pool.query('BEGIN');
        await pool.query('DELETE FROM tasks');
        await pool.query('DELETE FROM stages');
        await pool.query('COMMIT');
        
        await initializeDefaultData();
        res.json({ success: true, message: 'Data reset to default' });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Start server and initialize database
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`
        ╔════════════════════════════════════════════╗
        ║   Tender Project Management System         ║
        ║   Server running at:                       ║
        ║   http://localhost:${PORT}                     ║
        ║                                            ║
        ║   Database: PostgreSQL                     ║
        ║   Environment: ${process.env.NODE_ENV || 'development'}                  ║
        ╚════════════════════════════════════════════╝
        `);
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await pool.end();
    console.log('\nDatabase connection closed.');
    process.exit(0);
});
