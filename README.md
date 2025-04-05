# Aplicação para apontamento de horas trabalhadas


## Resumo

O código desse repositório tem por objetivo armazenar registros de apontamento de horas trabalhadas, e apresentar os dados de forma gráfica, com análises descritivas.

O projeto usa um banco de dados SQLite hospedado localmente, e o frontend foi elaborado usando o framework Remix. O projeto também utiliza Zenstack e Prisma para manipulação do banco de dados, componentes gráficos da biblioteca SyncFusion e lodash para agrupamentos.

## Seções/rotas e arquivos acessórios
### Seções
* Sidebar: contém barra lateral, renderizada em todas as rotas, com links manuais para as diferentes visualizações;
* _index: rota inicial, com apresentação do sistema e instruções básicas de navegação;
* agenda: agenda para apresentação das datas marcos dos projetos (datas de entregas, reuniões, etc);  
* api.save-tasks: endpoint de API que recebe os dados do frontend e envia para o backend, para atualização, deleção ou criação de novas tarefas no gráfico de Gantt, com atribuição de recursos;  
* api.task-reorder: endoint de API que coordena a ordenação das tarefas no gráfico de Gantt;    
* costs: rota que utiliza informações do custo da hora trabalhada por funcionário, e realiza o cálculo do custo total do projeto, com base nas horas apontadas;  
* gantt: rota que apresenta o gráfico de gantt, para planejamento das tarefas;
* login/logout: rotas para controle de acesso de usuário às informações financeiras do projeto;  
* mes: rota que apresenta o total de horas trabalhadas, por mês, por usuário, por ano;
* registros: rota que apresenta o total de horas trabalhadas, com filtros por funcionário, por obra, ou por período;
* relatorioObras: rota que apresenta o total de horas trabalhadas, por mês, por obra;

### Rotas para operações CRUD
* admin*: rotas para manipulação de qualquer tabela do banco de dados. Criada para ler o schema de cada tabela e oferecer opções de edição, deleção ou criação de novos registros;
* obras: tela para edição, deleção ou criação de novas obras;
* pessoas: tela para edição, deleção ou criação de novos funcionários;


## Próximos passos / Orientações para próximos projetos: 
* Criar um modelo de aprendizado de máquina (machine learning) para estimar a quantidade de horas para próximos projetos, melhorando a assertividade dos orçamentos e do planejamento;