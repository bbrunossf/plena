# Aplicação para apontamento de horas trabalhadas


## Resumo

O código desse repositório tem por objetivo criar uma aplicação executável (Windows) para auxiliar nos registros de horas trabalhadas, por projeto, nas categorias definidas.
Criado em Python com a interface usando a biblioteca Tkinter, a aplicação é encapsulada em um executável utilizando autopy-to-exe.
A aplicação faz conexão com um banco de dados SQLite hospedado em um servidor local (drive de rede mapeado), com o nome do usuário e outras configurações definidas em um arquivo $config.ini$, na mesma pasta da aplicação.
A interface apresenta um timer com contagem regressiva, com intervalo padrão de 60 minutos (1 hora), disparando uma segunda tela com as opções para seleção. São 3 menus dropdown:  
> seleção do projeto;  
> seleção da tarefa;  
> seleção da categoria,  
considerando que as opções já se encontram cadastradas no banco de dados.  
O objetivo é registrar, considerando o último intervalo decorrido, qual o projeto e tarefa que mais tomou tempo desse intervalo, ou seja, da última 1 hora que passou, qual tarefa o usuário passou mais tempo executando.  


## Descrição das classes e arquivos acessórios  
### Classes
> * AboutDialog: tela 'sobre', informando a versão da aplicação;
> * RetryDialog: tela com opção de repetir a tentativa de conexão com o servidor e executar a consulta ou adição de registro, caso a conexão tenha sido perdida;
> * DailyEntriesWindow: tela para consulta de lançamentos já registrados, com opção de intervalo de tempo, em dias, a partir da data atual (últimos n dias);  
> * AutoUpdater: tela para verificar se há um executável de versão posterior à atual, para atualização da versão local;  
> * DatabaseManager: classe com as funções CRUD do banco de dados;    
> * ProjectTrackingWindow: classe com configurações básicas;  
> * CountdownTimer: classe responsável pela tela principal;  

> * Arquivo 'config.ini': salva as configurações do nome do usuário, tempo inicial, e caminho para o arquivo do banco de dados;  

### Funções principais 
> Configurações: opções para configurar caminho para o banco de dados; nome do usuário e tempo inicial. Esses dados ficam salvos no arquivo de configuração 'config.ini';
> Apontar hora parcial: permite ao usuário fazer um lançamento parcial, considerando um intervalo de tempo decorrido menor do que o tempo inicial padrão. A aplicação apresenta uma caixa já preenchida com o tempo (em minutos) decorridos em relação ao tempo inicial padrão. Após informar a quantidade, é apresentada a tela padrão para seleção do projeto e tarefa a ser registrada;
> Verificar lançamentos: apresenta ao usuário uma tabela contendo os últimos lançamentos feitos por ele, em um intervalo de dias considerando a data atual.

## O que deve ser melhorado: 

> Utilizar um banco de dados com suporte à segurança por usuário, com controle de acesso e permissões;
> Utilizar outras bibliotecas de interface gráfica, para uma melhor experiência do usuário;
> Estudar outras linguagens de programação que possam gerar um arquivo executável menor e/ou sem dependências externas;
> Incluir verificações e validação de dados para os campos onde o usuário informe os dados digitando algum valor;
> Incluir backup automático do arquivo de banco de dados.