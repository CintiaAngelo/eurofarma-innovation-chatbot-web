// server.js - VERSÃO COMPLETA E CORRIGIDA

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

// Middleware para desativar cache
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ----------------------
// Rotas para o Chatbot
// ----------------------

// Endpoint: Retorna a última newsletter e a mensagem inicial
app.get('/api/chatbot/init', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT SQL_NO_CACHE * FROM newsletters ORDER BY data_envio_programada DESC LIMIT 1');
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
      
      console.log('Processando submissão de ideia:', { name, email, department, ideaTitle });
      
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
      
      // Inserir a ideia
      await db.query(
        'INSERT INTO ideias (id_colaborador, titulo_ideia, descricao_ideia_clob, status_ideia, data_submissao) VALUES (?, ?, ?, ?, NOW())',
        [id_colaborador, ideaTitle, ideaDescription, 'Em análise']
      );
      
      // Atualizar pontos do colaborador
      await db.query('UPDATE colaboradores SET pontos_gamificacao = pontos_gamificacao + 10 WHERE id_colaborador = ?', [id_colaborador]);
      
      // Registrar na tabela de gamificação
      await db.query(
        'INSERT INTO gamificacao_log (id_colaborador, pontos_ganhos, tipo_referencia, descricao_motivo) VALUES (?, ?, ?, ?)',
        [id_colaborador, 10, 'Ideias', 'Submissão de Ideia']
      );
      
      console.log('Ideia cadastrada com sucesso para o colaborador ID:', id_colaborador);
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
// Rota para Submeter Ideia (Formulário Direto)
// ----------------------

app.post('/api/ideas', async (req, res) => {
  try {
    const { name, email, phone, department, ideaTitle, ideaDescription } = req.body;
    
    console.log('Recebendo submissão de ideia via formulário:', { 
      name, email, department, ideaTitle 
    });

    if (!name || !email || !department || !ideaTitle || !ideaDescription) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

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

    // Inserir a ideia
    await db.query(
      'INSERT INTO ideias (id_colaborador, titulo_ideia, descricao_ideia_clob, status_ideia, data_submissao) VALUES (?, ?, ?, ?, NOW())',
      [id_colaborador, ideaTitle, ideaDescription, 'Em análise']
    );

    // Atualizar pontos
    await db.query('UPDATE colaboradores SET pontos_gamificacao = pontos_gamificacao + 10 WHERE id_colaborador = ?', [id_colaborador]);

    // Registrar gamificação
    await db.query(
      'INSERT INTO gamificacao_log (id_colaborador, pontos_ganhos, tipo_referencia, descricao_motivo) VALUES (?, ?, ?, ?)',
      [id_colaborador, 10, 'Ideias', 'Submissão de Ideia']
    );

    console.log('Ideia cadastrada com sucesso via formulário. ID Colaborador:', id_colaborador);
    
    res.status(201).json({ 
      message: 'Ideia salva com sucesso! Você ganhou 10 pontos.', 
      ideaId: id_colaborador 
    });
  } catch (err) {
    console.error('Erro ao salvar a ideia via formulário:', err);
    res.status(500).json({ error: 'Erro ao processar sua ideia.' });
  }
});

// ----------------------
// Rotas para a Admin Page
// ----------------------

// Endpoint: Busca todas as newsletters
app.get('/api/newsletters', async (req, res) => {
  try {
    console.log('=== BUSCANDO NEWSLETTERS ATUALIZADAS ===');
    const [rows] = await db.query('SELECT SQL_NO_CACHE * FROM newsletters ORDER BY data_envio_programada DESC');
    console.log('Total de newsletters encontradas:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar newsletters:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Endpoint: Envia uma nova newsletter
app.post('/api/newsletter', async (req, res) => {
  try {
    const { titulo, conteudo } = req.body;
    console.log('Recebendo nova newsletter:', { titulo });

    if (!titulo || !conteudo) {
      return res.status(400).json({ error: 'Título e conteúdo da newsletter são obrigatórios.' });
    }

    const [result] = await db.query(
      'INSERT INTO newsletters (titulo, conteudo_clob, status_envio, data_envio_programada) VALUES (?, ?, ?, NOW())',
      [titulo, conteudo, 'enviado']
    );

    console.log('Newsletter salva com sucesso. ID:', result.insertId);

    res.status(201).json({
      message: 'Newsletter salva com sucesso!',
      newsletterId: result.insertId
    });
  } catch (err) {
    console.error('Erro ao salvar a newsletter:', err);
    res.status(500).json({ error: 'Erro ao salvar a newsletter.' });
  }
});

// NOVOS ENDPOINTS PARA NEWSLETTERS
// Endpoint: Atualizar descrição da newsletter
app.put('/api/newsletters/:id/description', async (req, res) => {
  try {
    const newsletterId = req.params.id;
    const { description } = req.body;
    
    console.log('Atualizando descrição da newsletter ID:', newsletterId);
    
    await db.query(
      'UPDATE newsletters SET conteudo_clob = ? WHERE id_newsletter = ?',
      [description, newsletterId]
    );
    
    res.status(200).json({ message: 'Descrição atualizada com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar descrição da newsletter:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar a descrição.' });
  }
});

// Endpoint: Deletar newsletter
app.delete('/api/newsletters/:id', async (req, res) => {
  try {
    const newsletterId = req.params.id;
    
    console.log('Deletando newsletter ID:', newsletterId);
    
    await db.query('DELETE FROM newsletters WHERE id_newsletter = ?', [newsletterId]);
    
    res.status(200).json({ message: 'Newsletter deletada com sucesso!' });
  } catch (err) {
    console.error('Erro ao deletar newsletter:', err);
    res.status(500).json({ error: 'Erro interno ao deletar a newsletter.' });
  }
});

// Endpoint: Reenviar newsletter
app.post('/api/newsletters/:id/resend', async (req, res) => {
  try {
    const newsletterId = req.params.id;
    
    console.log('Reenviando newsletter ID:', newsletterId);
    
    // Atualizar status para "enviado" e data para agora
    await db.query(
      'UPDATE newsletters SET status_envio = "enviado", data_envio_programada = NOW() WHERE id_newsletter = ?',
      [newsletterId]
    );
    
    res.status(200).json({ message: 'Newsletter reenviada com sucesso!' });
  } catch (err) {
    console.error('Erro ao reenviar newsletter:', err);
    res.status(500).json({ error: 'Erro interno ao reenviar a newsletter.' });
  }
});

// Endpoint: Atualizar newsletter completa
app.put('/api/newsletters/:id', async (req, res) => {
  try {
    const newsletterId = req.params.id;
    const newsletterData = req.body;
    
    console.log('Atualizando newsletter completa ID:', newsletterId);
    
    await db.query(
      'UPDATE newsletters SET titulo = ?, conteudo_clob = ?, status_envio = ? WHERE id_newsletter = ?',
      [newsletterData.titulo, newsletterData.conteudo_clob, newsletterData.status_envio, newsletterId]
    );
    
    res.status(200).json({ message: 'Newsletter atualizada com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar newsletter:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar a newsletter.' });
  }
});

// Endpoint: Busca todas as ideias
app.get('/api/ideas', async (req, res) => {
  try {
    console.log('=== BUSCANDO IDEIAS ATUALIZADAS ===');
    const [rows] = await db.query(`
      SELECT SQL_NO_CACHE i.*, c.nome, c.email, c.departamento 
      FROM ideias i 
      JOIN colaboradores c ON i.id_colaborador = c.id_colaborador 
      ORDER BY data_submissao DESC
    `);
    console.log('Total de ideias encontradas:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar ideias:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Endpoint: Atualiza uma ideia
app.put('/api/ideas/:id', async (req, res) => {
  try {
    const ideaId = req.params.id;
    const { titulo_ideia, descricao_ideia_clob, status_ideia } = req.body;
    
    console.log('Atualizando ideia ID:', ideaId, 'Status:', status_ideia);
    
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

// Endpoint: Busca o colaborador com mais pontos
app.get('/api/gamification/top-employee', async (req, res) => {
  try {
    console.log('=== BUSCANDO TOP EMPLOYEE ATUALIZADO ===');
    const [rows] = await db.query('SELECT SQL_NO_CACHE nome, pontos_gamificacao, departamento FROM colaboradores ORDER BY pontos_gamificacao DESC LIMIT 1');
    console.log('Top employee:', rows[0]);
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

// ----------------------
// ENDPOINTS PARA ANALYTICS
// ----------------------

// Endpoint: Busca estatísticas completas de analytics
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    console.log('=== BUSCANDO DADOS ATUALIZADOS DO DASHBOARD ===');
    
    // Total de ideias
    const [totalIdeas] = await db.query('SELECT SQL_NO_CACHE COUNT(*) as total FROM ideias');
    console.log('Total de ideias:', totalIdeas[0].total);
    
    // Ideias por status
    const [ideasByStatus] = await db.query(`
      SELECT SQL_NO_CACHE status_ideia, COUNT(*) as count 
      FROM ideias 
      GROUP BY status_ideia
    `);
    console.log('Ideias por status:', ideasByStatus);
    
    // Ideias por departamento
    const [ideasByDept] = await db.query(`
      SELECT SQL_NO_CACHE c.departamento, COUNT(*) as count 
      FROM ideias i 
      JOIN colaboradores c ON i.id_colaborador = c.id_colaborador 
      GROUP BY c.departamento 
      ORDER BY count DESC
    `);
    console.log('Ideias por departamento:', ideasByDept);
    
    // Ideias por mês (últimos 6 meses)
    const [ideasByMonth] = await db.query(`
      SELECT SQL_NO_CACHE
        DATE_FORMAT(data_submissao, '%Y-%m') as month,
        COUNT(*) as count
      FROM ideias 
      WHERE data_submissao >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(data_submissao, '%Y-%m')
      ORDER BY month
    `);
    console.log('Ideias por mês:', ideasByMonth);
    
    // Top 5 colaboradores
    const [topEmployees] = await db.query(`
      SELECT SQL_NO_CACHE nome, departamento, pontos_gamificacao 
      FROM colaboradores 
      ORDER BY pontos_gamificacao DESC 
      LIMIT 5
    `);
    console.log('Top colaboradores:', topEmployees);
    
    // Pontos distribuídos no total
    const [totalPoints] = await db.query(`
      SELECT SQL_NO_CACHE SUM(pontos_ganhos) as total_points 
      FROM gamificacao_log
    `);
    console.log('Total de pontos:', totalPoints[0]?.total_points || 0);
    
    // Taxa de implementação
    const [implementationRate] = await db.query(`
      SELECT SQL_NO_CACHE
        COUNT(*) as total,
        SUM(CASE WHEN status_ideia = 'Implementada' THEN 1 ELSE 0 END) as implemented
      FROM ideias
    `);

    const implementationRateValue = implementationRate[0].total > 0 
      ? (implementationRate[0].implemented / implementationRate[0].total * 100) 
      : 0;
    
    console.log('Taxa de implementação:', implementationRateValue);
    console.log('=== FIM DA BUSCA DE DADOS ===');

    res.json({
      totalIdeas: totalIdeas[0].total,
      ideasByStatus,
      ideasByDepartment: ideasByDept,
      ideasByMonth,
      topEmployees,
      totalPoints: totalPoints[0]?.total_points || 0,
      implementationRate: implementationRateValue,
      implementedIdeas: implementationRate[0].implemented || 0
    });
  } catch (err) {
    console.error('Erro detalhado ao buscar dados de analytics:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Endpoint: Busca métricas de engajamento
app.get('/api/analytics/engagement', async (req, res) => {
  try {
    console.log('=== BUSCANDO DADOS DE ENGAJAMENTO ===');
    
    // Colaboradores mais ativos
    const [activeUsers] = await db.query(`
      SELECT SQL_NO_CACHE c.nome, c.departamento, COUNT(i.id_ideia) as ideas_submitted
      FROM colaboradores c
      LEFT JOIN ideias i ON c.id_colaborador = i.id_colaborador
      GROUP BY c.id_colaborador, c.nome, c.departamento
      HAVING ideas_submitted > 0
      ORDER BY ideas_submitted DESC
      LIMIT 10
    `);
    console.log('Usuários ativos:', activeUsers);

    // Departamentos mais engajados
    const [activeDepts] = await db.query(`
      SELECT SQL_NO_CACHE c.departamento, COUNT(i.id_ideia) as ideas_submitted
      FROM colaboradores c
      LEFT JOIN ideias i ON c.id_colaborador = i.id_colaborador
      GROUP BY c.departamento
      HAVING ideas_submitted > 0
      ORDER BY ideas_submitted DESC
    `);
    console.log('Departamentos ativos:', activeDepts);

    // Estatísticas de interações
    const [interactionStats] = await db.query(`
      SELECT SQL_NO_CACHE
        COUNT(*) as total_interactions,
        COUNT(DISTINCT id_colaborador) as unique_users
      FROM interacoes
    `);
    console.log('Estatísticas de interações:', interactionStats[0]);

    res.json({
      activeUsers,
      activeDepts,
      totalInteractions: interactionStats[0]?.total_interactions || 0,
      uniqueUsers: interactionStats[0]?.unique_users || 0
    });
  } catch (err) {
    console.error('Erro ao buscar métricas de engajamento:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Endpoint: Busca histórico de pontos
app.get('/api/analytics/points-history', async (req, res) => {
  try {
    console.log('=== BUSCANDO HISTÓRICO DE PONTOS ===');
    
    const [pointsHistory] = await db.query(`
      SELECT SQL_NO_CACHE
        DATE_FORMAT(data_concessao, '%Y-%m') as month,
        SUM(pontos_ganhos) as total_points
      FROM gamificacao_log 
      WHERE data_concessao >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(data_concessao, '%Y-%m')
      ORDER BY month
    `);
    console.log('Histórico de pontos:', pointsHistory);

    const [pointsByType] = await db.query(`
      SELECT SQL_NO_CACHE tipo_referencia, SUM(pontos_ganhos) as total_points
      FROM gamificacao_log
      GROUP BY tipo_referencia
      ORDER BY total_points DESC
    `);
    console.log('Pontos por tipo:', pointsByType);

    res.json({
      pointsHistory,
      pointsByType
    });
  } catch (err) {
    console.error('Erro ao buscar histórico de pontos:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Rota de saúde do servidor
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando corretamente' });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`=== SERVIDOR RODANDO NA PORTA ${PORT} ===`);
  console.log('=== CACHE DESABILITADO - DADOS EM TEMPO REAL ===');
  console.log('=== ROTAS DISPONÍVEIS: ===');
  console.log('GET  /api/chatbot/init');
  console.log('POST /api/chatbot/next-step');
  console.log('POST /api/ideas');
  console.log('GET  /api/ideas');
  console.log('PUT  /api/ideas/:id');
  console.log('GET  /api/newsletters');
  console.log('POST /api/newsletter');
  console.log('PUT  /api/newsletters/:id/description');
  console.log('DELETE /api/newsletters/:id');
  console.log('POST /api/newsletters/:id/resend');
  console.log('PUT  /api/newsletters/:id');
  console.log('GET  /api/analytics/dashboard');
  console.log('GET  /api/analytics/engagement');
  console.log('GET  /api/analytics/points-history');
  console.log('GET  /api/gamification/top-employee');
});