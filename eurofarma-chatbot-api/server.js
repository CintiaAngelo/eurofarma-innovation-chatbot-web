// server.js

const express = require('express');
const cors = require('cors');
const db = require('./db');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Carrega a árvore de decisão do arquivo JSON
const decisionTree = JSON.parse(fs.readFileSync('./decisionTree.json', 'utf8'));

// Middleware
app.use(cors());
app.use(express.json());

// ----------------------
// Rotas para o Chatbot
// ----------------------

// Endpoint: Retorna a última newsletter e a mensagem inicial
app.get('/api/chatbot/init', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM newsletters ORDER BY data_envio_programada DESC LIMIT 1');
    if (rows.length > 0) {
      const latestNewsletter = rows[0];
      res.json({
        message: "Olá! Eu sou o assistente de inovação da Eurofarma. Aqui você pode acompanhar as últimas novidades do nosso time de inovação e compartilhar suas ideias conosco.",
        newsletter: {
          titulo: latestNewsletter.titulo,
          conteudo_clob: latestNewsletter.conteudo_clob
        },
        prompt_idea: "Gostaria de compartilhar uma ideia com o time de inovação? Você ganha 10 pontos por cada ideia enviada!",
        button_text: "Enviar minha ideia"
      });
    } else {
      res.json({
        message: "Ainda não há newsletters. Por favor, volte mais tarde.",
        newsletter: null,
        prompt_idea: "Gostaria de compartilhar uma ideia com o time de inovação?",
        button_text: "Enviar minha ideia"
      });
    }
  } catch (err) {
    console.error('Erro ao buscar a newsletter:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Endpoint: Navega na árvore de decisão do chatbot
app.post('/api/chatbot/next-step', async (req, res) => {
  const { currentStepId, userResponse, collectedData } = req.body;
  if (!currentStepId) {
    return res.status(400).json({ error: 'currentStepId é obrigatório.' });
  }

  let nextStepId;
  const currentStep = decisionTree[currentStepId];

  if (currentStep.options) {
    const option = currentStep.options.find(opt => opt.text === userResponse);
    nextStepId = option ? option.next : 'end_cancel';
  } else {
    nextStepId = currentStep.next;
  }

  if (nextStepId === 'submit') {
    try {
      const { name, email, phone, department, ideaTitle, ideaDescription } = collectedData;
      let id_colaborador;
      const [colaboradorExistente] = await db.query('SELECT id_colaborador FROM colaboradores WHERE email = ?', [email]);
      if (colaboradorExistente.length > 0) {
        id_colaborador = colaboradorExistente[0].id_colaborador;
        await db.query('UPDATE colaboradores SET nome = ?, telefone_whatsapp = ?, departamento = ? WHERE id_colaborador = ?',
          [name, phone, department, id_colaborador]);
      } else {
        const [novoColaborador] = await db.query(
          'INSERT INTO colaboradores (nome, email, telefone_whatsapp, departamento, pontos_gamificacao) VALUES (?, ?, ?, ?, 0)',
          [name, email, phone, department]
        );
        id_colaborador = novoColaborador.insertId;
      }
      await db.query(
        'INSERT INTO ideias (id_colaborador, titulo_ideia, descricao_ideia_clob, status_ideia, data_submissao) VALUES (?, ?, ?, ?, NOW())',
        [id_colaborador, ideaTitle, ideaDescription, 'Em análise']
      );
      await db.query('UPDATE colaboradores SET pontos_gamificacao = pontos_gamificacao + 10 WHERE id_colaborador = ?', [id_colaborador]);
      await db.query(
        'INSERT INTO gamificacao_log (id_colaborador, pontos_ganhos, tipo_referencia, descricao_motivo) VALUES (?, ?, ?, ?)',
        [id_colaborador, 10, 'Ideias', 'Submissão de Ideia']
      );
      return res.json({ step: decisionTree['end_success'] });
    } catch (err) {
      console.error('Erro ao salvar a ideia e dados do colaborador:', err);
      return res.status(500).json({ error: 'Erro ao processar sua ideia.' });
    }
  }

  const nextStep = decisionTree[nextStepId];
  if (nextStep) {
    res.json({ stepId: nextStepId, step: nextStep });
  } else {
    res.status(404).json({ error: 'Próximo passo não encontrado.' });
  }
});

// ----------------------
// Rota para Submeter Ideia
// ----------------------

// Endpoint: Recebe e salva uma nova ideia diretamente do formulário
app.post('/api/ideas', async (req, res) => {
  try {
    const { name, email, phone, department, ideaTitle, ideaDescription } = req.body;
    let id_colaborador;
    const [colaboradorExistente] = await db.query('SELECT id_colaborador FROM colaboradores WHERE email = ?', [email]);
    if (colaboradorExistente.length > 0) {
      id_colaborador = colaboradorExistente[0].id_colaborador;
      await db.query('UPDATE colaboradores SET nome = ?, telefone_whatsapp = ?, departamento = ? WHERE id_colaborador = ?',
        [name, phone, department, id_colaborador]);
    } else {
      const [novoColaborador] = await db.query(
        'INSERT INTO colaboradores (nome, email, telefone_whatsapp, departamento, pontos_gamificacao) VALUES (?, ?, ?, ?, 0)',
        [name, email, phone, department]
      );
      id_colaborador = novoColaborador.insertId;
    }
    await db.query(
      'INSERT INTO ideias (id_colaborador, titulo_ideia, descricao_ideia_clob, status_ideia, data_submissao) VALUES (?, ?, ?, ?, NOW())',
      [id_colaborador, ideaTitle, ideaDescription, 'Em análise']
    );
    await db.query('UPDATE colaboradores SET pontos_gamificacao = pontos_gamificacao + 10 WHERE id_colaborador = ?', [id_colaborador]);
    await db.query(
      'INSERT INTO gamificacao_log (id_colaborador, pontos_ganhos, tipo_referencia, descricao_motivo) VALUES (?, ?, ?, ?)',
      [id_colaborador, 10, 'Ideias', 'Submissão de Ideia']
    );
    res.status(201).json({ message: 'Ideia salva com sucesso!', ideaId: id_colaborador });
  } catch (err) {
    console.error('Erro ao salvar a ideia e dados do colaborador:', err);
    res.status(500).json({ error: 'Erro ao processar sua ideia.' });
  }
});

// ----------------------
// Rotas para a Admin Page
// ----------------------

// Endpoint: Busca todas as newsletters
app.get('/api/newsletters', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM newsletters ORDER BY data_envio_programada DESC');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar newsletters:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Endpoint: Busca todas as ideias
app.get('/api/ideas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT i.*, c.nome, c.email, c.departamento FROM ideias i JOIN colaboradores c ON i.id_colaborador = c.id_colaborador ORDER BY data_submissao DESC');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar ideias:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Endpoint: Atualiza o status e outros dados de uma ideia
app.put('/api/ideas/:id', async (req, res) => {
  try {
    const ideaId = req.params.id;
    const { titulo_ideia, descricao_ideia_clob, status_ideia } = req.body;
    
    await db.query(
      'UPDATE ideias SET titulo_ideia = ?, descricao_ideia_clob = ?, status_ideia = ? WHERE id_ideia = ?',
      [titulo_ideia, descricao_ideia_clob, status_ideia, ideaId]
    );
    
    res.status(200).json({ message: 'Ideia atualizada com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar a ideia:', err);
    res.status(500).json({ error: 'Erro interno no servidor ao atualizar a ideia.' });
  }
});

// Endpoint: Envia uma nova newsletter
app.post('/api/newsletter', async (req, res) => {
  const { titulo, conteudo } = req.body;
  if (!titulo || !conteudo) {
    return res.status(400).json({ error: 'Título e conteúdo da newsletter são obrigatórios.' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO newsletters (titulo, conteudo_clob, status_envio, data_envio_programada) VALUES (?, ?, ?, NOW())',
      [titulo, conteudo, 'enviado']
    );
    res.status(201).json({
      message: 'Newsletter salva com sucesso!',
      newsletterId: result.insertId
    });
  } catch (err) {
    console.error('Erro ao salvar a newsletter:', err);
    res.status(500).json({ error: 'Erro ao salvar a newsletter.' });
  }
});

// Endpoint: Busca o colaborador com mais pontos
app.get('/api/gamification/top-employee', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT nome, pontos_gamificacao, departamento FROM colaboradores ORDER BY pontos_gamificacao DESC LIMIT 1');
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Nenhum colaborador encontrado.' });
    }
  } catch (err) {
    console.error('Erro ao buscar o funcionário com mais pontos:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});


// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


// Adicione estas rotas no server.js

// Endpoint: Busca estatísticas completas de analytics
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    // Total de ideias
    const [totalIdeas] = await db.query('SELECT COUNT(*) as total FROM ideias');
    
    // Ideias por status
    const [ideasByStatus] = await db.query(`
      SELECT status_ideia, COUNT(*) as count 
      FROM ideias 
      GROUP BY status_ideia
    `);
    
    // Ideias por departamento
    const [ideasByDept] = await db.query(`
      SELECT c.departamento, COUNT(*) as count 
      FROM ideias i 
      JOIN colaboradores c ON i.id_colaborador = c.id_colaborador 
      GROUP BY c.departamento 
      ORDER BY count DESC
    `);
    
    // Ideias por mês (últimos 6 meses)
    const [ideasByMonth] = await db.query(`
      SELECT 
        DATE_FORMAT(data_submissao, '%Y-%m') as month,
        COUNT(*) as count
      FROM ideias 
      WHERE data_submissao >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(data_submissao, '%Y-%m')
      ORDER BY month
    `);
    
    // Top 5 colaboradores
    const [topEmployees] = await db.query(`
      SELECT nome, departamento, pontos_gamificacao 
      FROM colaboradores 
      ORDER BY pontos_gamificacao DESC 
      LIMIT 5
    `);
    
    // Pontos distribuídos no total
    const [totalPoints] = await db.query(`
      SELECT SUM(pontos_ganhos) as total_points 
      FROM gamificacao_log
    `);
    
    // Taxa de implementação
    const [implementationRate] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status_ideia = 'Implementada' THEN 1 ELSE 0 END) as implemented
      FROM ideias
    `);

    res.json({
      totalIdeas: totalIdeas[0].total,
      ideasByStatus,
      ideasByDepartment: ideasByDept,
      ideasByMonth,
      topEmployees,
      totalPoints: totalPoints[0].total_points || 0,
      implementationRate: implementationRate[0].implemented / implementationRate[0].total * 100 || 0,
      implementedIdeas: implementationRate[0].implemented || 0
    });
  } catch (err) {
    console.error('Erro ao buscar dados de analytics:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Endpoint: Busca métricas de engajamento
app.get('/api/analytics/engagement', async (req, res) => {
  try {
    // Colaboradores mais ativos
    const [activeUsers] = await db.query(`
      SELECT c.nome, c.departamento, COUNT(i.id_ideia) as ideas_submitted
      FROM colaboradores c
      LEFT JOIN ideias i ON c.id_colaborador = i.id_colaborador
      GROUP BY c.id_colaborador, c.nome, c.departamento
      HAVING ideas_submitted > 0
      ORDER BY ideas_submitted DESC
      LIMIT 10
    `);

    // Departamentos mais engajados
    const [activeDepts] = await db.query(`
      SELECT c.departamento, COUNT(i.id_ideia) as ideas_submitted
      FROM colaboradores c
      LEFT JOIN ideias i ON c.id_colaborador = i.id_colaborador
      GROUP BY c.departamento
      HAVING ideas_submitted > 0
      ORDER BY ideas_submitted DESC
    `);

    // Tempo médio desde submissão até implementação
    const [avgImplementationTime] = await db.query(`
      SELECT AVG(DATEDIFF(
        (SELECT MAX(data_mudanca_status) FROM ideias_historico WHERE id_ideia = i.id_ideia AND status_ideia = 'Implementada'),
        i.data_submissao
      )) as avg_days
      FROM ideias i
      WHERE i.status_ideia = 'Implementada'
    `);

    res.json({
      activeUsers,
      activeDepts,
      avgImplementationTime: avgImplementationTime[0]?.avg_days || 0
    });
  } catch (err) {
    console.error('Erro ao buscar métricas de engajamento:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});