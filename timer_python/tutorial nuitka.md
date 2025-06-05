- rodar no ambiente python puro (sem Anaconda)
- instalar as dependências (pode criar um ambiente virtual)
- instalar o compilador com o VS build
- executar o nuitka (deixar ele baixar o que for necessário)
	sintaxe completa:
	nuitka --standalone --onefile --enable-plugin=tk-inter --windows-console-mode=disable --windows-icon-from-ico=icone.ico rev12d.py

standalone: cria versão auto-dependente, sem precisar de pacotes externos
onefile: cria um único arquivo executável
windows-disable-console: oculta a tela de console
windows-icon-from-ico: adiciona um ícone .ico ao executável

- assinar o executável
