const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('./tender_project.db');

// Create tables and initialize with default data
db.serialize(() => {
    // Create stages table
    db.run(`
        CREATE TABLE IF NOT EXISTS stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create tasks table
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_id INTEGER,
            text TEXT,
            completed BOOLEAN DEFAULT 0,
            position INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
        )
    `);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_stage_status ON stages(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_task_stage ON tasks(stage_id)`);
    
    // Check if data exists
    db.get("SELECT COUNT(*) as count FROM stages", (err, row) => {
        if (row && row.count === 0) {
            console.log('Initializing database with default data...');
            initializeDefaultData();
        } else {
            console.log(`Database contains ${row ? row.count : 0} stages`);
        }
    });
});

// Initialize default data
function initializeDefaultData() {
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

    const stageStmt = db.prepare(`
        INSERT INTO stages (number, name, icon, weeks, hours, cost, status, brief, description, progress)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const taskStmt = db.prepare(`
        INSERT INTO tasks (stage_id, text, completed, position)
        VALUES (?, ?, ?, ?)
    `);

    defaultStages.forEach(stage => {
        stageStmt.run(
            stage.number,
            stage.name,
            stage.icon,
            stage.weeks,
            stage.hours,
            stage.cost,
            stage.status,
            stage.brief,
            stage.description,
            stage.progress,
            function(err) {
                if (!err) {
                    const stageId = this.lastID;
                    stage.tasks.forEach((task, index) => {
                        taskStmt.run(stageId, task.text, task.completed ? 1 : 0, index);
                    });
                }
            }
        );
    });

    stageStmt.finalize();
    taskStmt.finalize();
}

// API Routes

// Get all stages with tasks
app.get('/api/stages', (req, res) => {
    db.all(`
        SELECT * FROM stages ORDER BY number
    `, (err, stages) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Get tasks for each stage
        const stagesWithTasks = [];
        let processed = 0;
        
        if (stages.length === 0) {
            res.json([]);
            return;
        }
        
        stages.forEach(stage => {
            db.all(`
                SELECT * FROM tasks 
                WHERE stage_id = ? 
                ORDER BY position, id
            `, [stage.id], (err, tasks) => {
                if (!err) {
                    stage.tasks = tasks.map(t => ({
                        id: t.id,
                        text: t.text,
                        completed: t.completed === 1
                    }));
                } else {
                    stage.tasks = [];
                }
                
                stagesWithTasks.push(stage);
                processed++;
                
                if (processed === stages.length) {
                    // Sort by number before sending
                    stagesWithTasks.sort((a, b) => a.number - b.number);
                    res.json(stagesWithTasks);
                }
            });
        });
    });
});

// Create new stage
app.post('/api/stages', (req, res) => {
    const { name, icon, weeks, hours, cost, brief, description, tasks } = req.body;
    
    // Get max stage number
    db.get(`SELECT MAX(number) as maxNum FROM stages`, (err, row) => {
        const number = (row && row.maxNum) ? row.maxNum + 1 : 1;
        
        db.run(`
            INSERT INTO stages (number, name, icon, weeks, hours, cost, status, brief, description, progress)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, 0)
        `, [number, name, icon || '📋', weeks, hours, cost, brief, description], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const stageId = this.lastID;
            
            // Add tasks if provided
            if (tasks && tasks.length > 0) {
                const taskStmt = db.prepare(`
                    INSERT INTO tasks (stage_id, text, completed, position)
                    VALUES (?, ?, 0, ?)
                `);
                
                tasks.forEach((taskText, index) => {
                    taskStmt.run(stageId, taskText, index);
                });
                
                taskStmt.finalize();
            }
            
            res.json({ 
                id: stageId, 
                number,
                name,
                icon: icon || '📋',
                weeks,
                hours,
                cost,
                status: 'pending',
                brief,
                description,
                progress: 0
            });
        });
    });
});

// Update stage
app.put('/api/stages/:id', (req, res) => {
    const { id } = req.params;
    const { status, brief, description, progress, name, icon, weeks, hours, cost } = req.body;
    
    const updates = [];
    const values = [];
    
    if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
    }
    if (brief !== undefined) {
        updates.push('brief = ?');
        values.push(brief);
    }
    if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
    }
    if (progress !== undefined) {
        updates.push('progress = ?');
        values.push(progress);
    }
    if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
    }
    if (icon !== undefined) {
        updates.push('icon = ?');
        values.push(icon);
    }
    if (weeks !== undefined) {
        updates.push('weeks = ?');
        values.push(weeks);
    }
    if (hours !== undefined) {
        updates.push('hours = ?');
        values.push(hours);
    }
    if (cost !== undefined) {
        updates.push('cost = ?');
        values.push(cost);
    }
    
    if (updates.length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
    }
    
    values.push(id);
    
    db.run(`
        UPDATE stages 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, values, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, changes: this.changes });
    });
});

// Delete stage
app.delete('/api/stages/:id', (req, res) => {
    const { id } = req.params;
    
    db.serialize(() => {
        // First delete all tasks for this stage
        db.run(`DELETE FROM tasks WHERE stage_id = ?`, [id], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Then delete the stage
            db.run(`DELETE FROM stages WHERE id = ?`, [id], function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                // Renumber remaining stages
                db.run(`
                    UPDATE stages 
                    SET number = (
                        SELECT COUNT(*) + 1 
                        FROM stages s2 
                        WHERE s2.number < stages.number
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error renumbering stages:', err);
                    }
                    res.json({ success: true, changes: this.changes });
                });
            });
        });
    });
});

// Add task
app.post('/api/stages/:stageId/tasks', (req, res) => {
    const { stageId } = req.params;
    const { text } = req.body;
    
    // Get max position
    db.get(`
        SELECT MAX(position) as maxPos FROM tasks WHERE stage_id = ?
    `, [stageId], (err, row) => {
        const position = (row && row.maxPos !== null) ? row.maxPos + 1 : 0;
        
        db.run(`
            INSERT INTO tasks (stage_id, text, completed, position)
            VALUES (?, ?, 0, ?)
        `, [stageId, text, position], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                id: this.lastID, 
                text, 
                completed: false,
                position 
            });
        });
    });
});

// Toggle task
app.put('/api/tasks/:id/toggle', (req, res) => {
    const { id } = req.params;
    
    db.run(`
        UPDATE tasks 
        SET completed = NOT completed
        WHERE id = ?
    `, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Get updated task
        db.get(`SELECT * FROM tasks WHERE id = ?`, [id], (err, task) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                success: true, 
                completed: task.completed === 1 
            });
        });
    });
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    
    db.run(`DELETE FROM tasks WHERE id = ?`, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, changes: this.changes });
    });
});

// Update task text
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    
    db.run(`
        UPDATE tasks 
        SET text = ?
        WHERE id = ?
    `, [text, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const stats = {};
    
    db.all(`
        SELECT 
            COUNT(*) as total_stages,
            SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'testing' THEN 1 ELSE 0 END) as testing,
            AVG(progress) as avg_progress,
            SUM(hours * progress / 100) as hours_worked,
            SUM(hours) as total_hours
        FROM stages
    `, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        db.get(`
            SELECT 
                COUNT(*) as total_tasks,
                SUM(completed) as completed_tasks
            FROM tasks
        `, (err, taskStats) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                ...row[0],
                ...taskStats
            });
        });
    });
});

// Export data
app.get('/api/export', (req, res) => {
    db.all(`
        SELECT * FROM stages ORDER BY number
    `, (err, stages) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const exportData = [];
        let processed = 0;
        
        if (stages.length === 0) {
            res.json([]);
            return;
        }
        
        stages.forEach(stage => {
            db.all(`
                SELECT text, completed FROM tasks 
                WHERE stage_id = ? 
                ORDER BY position, id
            `, [stage.id], (err, tasks) => {
                const stageData = {
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
                    tasks: tasks.map(t => ({
                        text: t.text,
                        completed: t.completed === 1
                    }))
                };
                
                exportData.push(stageData);
                processed++;
                
                if (processed === stages.length) {
                    exportData.sort((a, b) => a.number - b.number);
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Disposition', 'attachment; filename="project_stages.json"');
                    res.json(exportData);
                }
            });
        });
    });
});

// Import data
app.post('/api/import', (req, res) => {
    const stages = req.body;
    
    if (!Array.isArray(stages)) {
        res.status(400).json({ error: 'Invalid data format' });
        return;
    }
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Clear existing data
        db.run('DELETE FROM tasks');
        db.run('DELETE FROM stages');
        
        const stageStmt = db.prepare(`
            INSERT INTO stages (number, name, icon, weeks, hours, cost, status, brief, description, progress)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const taskStmt = db.prepare(`
            INSERT INTO tasks (stage_id, text, completed, position)
            VALUES (?, ?, ?, ?)
        `);
        
        let stageCount = 0;
        
        stages.forEach(stage => {
            stageStmt.run(
                stage.number,
                stage.name,
                stage.icon,
                stage.weeks,
                stage.hours,
                stage.cost,
                stage.status,
                stage.brief,
                stage.description,
                stage.progress || 0,
                function(err) {
                    if (!err) {
                        const stageId = this.lastID;
                        
                        if (stage.tasks && stage.tasks.length > 0) {
                            stage.tasks.forEach((task, index) => {
                                taskStmt.run(
                                    stageId, 
                                    task.text, 
                                    task.completed ? 1 : 0, 
                                    index
                                );
                            });
                        }
                    }
                    
                    stageCount++;
                    if (stageCount === stages.length) {
                        stageStmt.finalize();
                        taskStmt.finalize();
                        
                        db.run('COMMIT', (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                res.status(500).json({ error: err.message });
                            } else {
                                res.json({ success: true, imported: stages.length });
                            }
                        });
                    }
                }
            );
        });
    });
});

// Reset to default data
app.post('/api/reset', (req, res) => {
    db.serialize(() => {
        // Удаляем старые данные
        db.run('DELETE FROM tasks', (err) => {
            if (err) {
                console.error('Error deleting tasks:', err);
            }
        });
        
        db.run('DELETE FROM stages', (err) => {
            if (err) {
                console.error('Error deleting stages:', err);
            } else {
                // После успешной очистки инициализируем заново
                setTimeout(() => {
                    initializeDefaultData();
                    setTimeout(() => {
                        res.json({ success: true, message: 'Data reset to default' });
                    }, 500);
                }, 100);
            }
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║   Tender Project Management System         ║
    ║   Server running at:                       ║
    ║   http://localhost:${PORT}                 ║
    ║                                            ║
    ║   Database: tender_project.db              ║
    ║   API Endpoints:                           ║
    ║   GET    /api/stages                       ║
    ║   POST   /api/stages                       ║
    ║   PUT    /api/stages/:id                   ║
    ║   DELETE /api/stages/:id                   ║
    ║   POST   /api/stages/:id/tasks             ║
    ║   PUT    /api/tasks/:id/toggle             ║
    ║   DELETE /api/tasks/:id                    ║
    ║   GET    /api/stats                        ║
    ║   GET    /api/export                       ║
    ║   POST   /api/import                       ║
    ║   POST   /api/reset                        ║
    ╚════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('\nDatabase connection closed.');
        process.exit(0);
    });
});
