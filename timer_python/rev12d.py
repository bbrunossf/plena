"""
Terceira versão com banco de dados postgres, com o pg8000
Mudança na sintaxe de conexão ao banco de dados (linha 291)
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog, simpledialog
from datetime import datetime, timedelta
#import sqlite3
#import psycopg
#from psycopg import sql

import pg8000

import configparser
import os
import requests
import sys
import hashlib
import subprocess
import json
import shutil
import time
import logging

# Configuração do logging
logging.basicConfig(
    filename='app.log',  # Nome do arquivo de log
    level=logging.DEBUG,  # Nível de log que será registrado
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Add this class at the top level of your script
class AboutDialog:
    def __init__(self, parent):
        self.dialog = tk.Toplevel(parent)
        self.dialog.title("Sobre")
        
        # Make dialog modal
        self.dialog.transient(parent)
        self.dialog.grab_set()
        
        # Set window size and center it
        window_width = 300
        window_height = 180
        screen_width = self.dialog.winfo_screenwidth()
        screen_height = self.dialog.winfo_screenheight()
        center_x = int(screen_width/2 - window_width/2)
        center_y = int(screen_height/2 - window_height/2)
        self.dialog.geometry(f'{window_width}x{window_height}+{center_x}+{center_y}')
        
        # Add content
        self.setup_gui()
        
    def setup_gui(self):
        # Application name and version
        tk.Label(
            self.dialog,
            text="Time Tracker",
            font=("Arial", 16, "bold")
        ).pack(pady=10)
        
        tk.Label(
            self.dialog,
            text="Versão 12",
            font=("Arial", 10)
        ).pack()
        
        tk.Label(
            self.dialog,
            text="© 2025 Plena Engenharia Estrutural",
            font=("Arial", 8)
        ).pack(pady=5)
        
        # OK button
        tk.Button(
            self.dialog,
            text="OK",
            command=self.dialog.destroy,
            width=10
        ).pack(pady=20)

class RetryDialog:
    def __init__(self, parent, message):
        self.result = None
        self.dialog = tk.Toplevel(parent)
        self.dialog.title("Erro de Conexão")
        
        # Tornar a janela modal
        self.dialog.transient(parent)
        self.dialog.grab_set()
        
        # Configurar tamanho e centralizar
        window_width = 400
        window_height = 150
        screen_width = self.dialog.winfo_screenwidth()
        screen_height = self.dialog.winfo_screenheight()
        center_x = int(screen_width/2 - window_width/2)
        center_y = int(screen_height/2 - window_height/2)
        self.dialog.geometry(f'{window_width}x{window_height}+{center_x}+{center_y}')
        
        # Mensagem de erro
        tk.Label(
            self.dialog,
            text=message,
            wraplength=350,
            justify="center"
        ).pack(pady=20)
        
        # Frame para os botões
        button_frame = tk.Frame(self.dialog)
        button_frame.pack(pady=10)
        
        # Botão Repetir
        tk.Button(
            button_frame,
            text="Repetir",
            command=self.retry,
            width=10
        ).pack(side=tk.LEFT, padx=5)
        
        # Botão Cancelar
        tk.Button(
            button_frame,
            text="Cancelar",
            command=self.cancel,
            width=10
        ).pack(side=tk.LEFT, padx=5)
        
        # Centralizar a janela
        self.dialog.update_idletasks()
        self.dialog.geometry('+{}+{}'.format(
            parent.winfo_rootx() + parent.winfo_width()//2 - window_width//2,
            parent.winfo_rooty() + parent.winfo_height()//2 - window_height//2))
    
    def retry(self):
        self.result = True
        self.dialog.destroy()
    
    def cancel(self):
        self.result = False
        self.dialog.destroy()
    
    def show(self):
        self.dialog.wait_window()
        return self.result

class DailyEntriesWindow:
    def __init__(self, parent, db_manager, config, initvalue):        
        """
        Janela para exibir os lançamentos do dia do usuário atual.
        
        Args:
            parent: Janela principal.
            db_manager: Instância do DatabaseManager.
            config: Configurações do aplicativo.
        """
        self.parent = parent
        self.db_manager = db_manager
        self.config = config
        self.initvalue = initvalue
         
        
        # Cria a janela
        self.window = tk.Toplevel(parent)
        self.window.title("Lançamentos do Dia")
        
        # Define o tamanho e centraliza a janela
        window_width = 600
        window_height = 400
        screen_width = self.window.winfo_screenwidth()
        screen_height = self.window.winfo_screenheight()
        center_x = int(screen_width / 2 - window_width / 2)
        center_y = int(screen_height / 2 - window_height / 2)
        self.window.geometry(f"{window_width}x{window_height}+{center_x}+{center_y}")
        
        # Cria a interface gráfica
        self.setup_gui()
        
        # Carrega os lançamentos do dia
        self.load_daily_entries()
    
    def setup_gui(self):
        """
        Configura a interface gráfica da janela.
        """
        # Frame para a tabela
        table_frame = tk.Frame(self.window)
        table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Cria a tabela usando Treeview
        self.tree = ttk.Treeview(
            table_frame,
            columns=("ID", "Timestamp", "Projeto", "Tarefa", "Categoria", "Duração (min)"),
            show="headings"
        )
        
        # Configura as colunas
        self.tree.heading("ID", text="ID")
        self.tree.heading("Timestamp", text="Data/Hora")
        self.tree.heading("Projeto", text="Projeto")
        self.tree.heading("Tarefa", text="Tarefa")
        self.tree.heading("Categoria", text="Categoria")
        self.tree.heading("Duração (min)", text="Duração (min)")
        
        # Define o tamanho das colunas
        self.tree.column("ID", width=50, anchor=tk.CENTER)
        self.tree.column("Timestamp", width=120, anchor=tk.CENTER)
        self.tree.column("Projeto", width=150, anchor=tk.W)
        self.tree.column("Tarefa", width=150, anchor=tk.W)
        self.tree.column("Categoria", width=100, anchor=tk.W)
        self.tree.column("Duração (min)", width=100, anchor=tk.CENTER)
        
        # Adiciona a tabela ao frame
        self.tree.pack(fill=tk.BOTH, expand=True)
        
        # Adiciona uma barra de rolagem
        scrollbar = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    
    def load_daily_entries(self):
        """
        Carrega os lançamentos do dia do usuário atual e exibe na tabela.
        """
        # Obtém o nome do usuário do config.ini
        user_name = self.config['User'].get('name', '')
        
        if not user_name:
            messagebox.showwarning("Aviso", "Nenhum usuário configurado.")
            return
        
        # Obtém o ID do usuário
        user_id = self.db_manager.get_nome_id(user_name)
        
        if not user_id:
            messagebox.showwarning("Aviso", f"Usuário '{user_name}' não encontrado no banco de dados.")
            return
                        
        dias = int(self.initvalue)        
        today = (datetime.now() - timedelta(days=dias)).strftime("%Y-%m-%d")        
        
        # Consulta os lançamentos do dia        
        query = """
        SELECT r.id_registro, r.timestamp, o.cod_obra || ' - ' || o.nome_obra AS projeto,
               t.nome_tipo AS tarefa, c.nome_categoria AS categoria, r.duracao_minutos
        FROM "Registro" r
        JOIN "Obra" o ON r.id_obra = o.id_obra
        JOIN "TipoTarefa" t ON r.id_tipo_tarefa = t.id_tipo_tarefa
        JOIN "Categoria" c ON r.id_categoria = c.id_categoria
        WHERE r.id_nome = %s AND DATE(r.timestamp) > %s
        ORDER BY r.timestamp
        """
        
        self.db_manager.cursor.execute(query, (user_id, today))
        
        
        # Limpa a tabela antes de adicionar novos dados
        for row in self.tree.get_children():
            self.tree.delete(row)
        
        # Adiciona os lançamentos na tabela
        for row in self.db_manager.cursor.fetchall():
            self.tree.insert("", tk.END, values=row)
        
        # Exibe uma mensagem se não houver lançamentos
        if not self.tree.get_children():
            messagebox.showinfo("Informação", "Nenhum lançamento encontrado para o dia de hoje.")





class DatabaseManager:
    def __init__(self, schema='dev'):
        self.schema = schema
        self.conn = None
        self.cursor = None
        try:
            logging.info(f"Tentando inicializar DatabaseManager com schema: {schema}")
            self.connect()
            logging.info("DatabaseManager inicializado com sucesso")
        except Exception as e:
            logging.error(f"Erro ao inicializar DatabaseManager: {e}")
            messagebox.showerror("Erro de Inicialização", f"Erro ao inicializar DatabaseManager: {e}")
            raise

    def connect(self):
        """Estabelece conexão com o banco de dados e define o search_path."""
        try:
            logging.info("Tentando conectar ao banco de dados PostgreSQL...")
            # Utilizando a nova string de conexão do pg8000
            self.conn = pg8000.connect(user="plena", password="123", database="plena", host="192.168.15.7", port=5432)
            logging.info("Conexão PostgreSQL estabelecida com sucesso")

            # Como o psycopg3 não usa mais um método cursor() separado, você deve criar o cursor no contexto
            self.cursor = self.conn.cursor()
            logging.info("Cursor criado com sucesso")

            # Defina o search_path (supondo que você tenha um método ou comando para isso)
            self.set_search_path()
            logging.info("Search path definido com sucesso")
        except pg8000.Error as e:
            logging.error(f"Erro de PostgreSQL ao conectar: {e}")
            messagebox.showerror("Erro de Conexão PostgreSQL", f"Erro ao conectar com PostgreSQL: {e}")
            raise
        except Exception as e:
            logging.error(f"Erro geral ao conectar ao banco: {e}")
            messagebox.showerror("Erro de Conexão", f"Erro geral ao conectar: {e}")
            raise

    def set_search_path(self):
        """Define o search_path para o schema configurado."""
        try:
            logging.info(f"Definindo search_path para schema: {self.schema}")
            self.cursor.execute(f"SET search_path TO {self.schema}")
            self.conn.commit()
            logging.info("Search path definido e commitado com sucesso")
        except Exception as e:
            logging.error(f"Erro ao definir search_path: {e}")
            messagebox.showerror("Erro de Schema", f"Erro ao definir search_path: {e}")
            raise
        
    def create_tables(self):
        # Projects table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )
        ''')
        
        # Tasks table with foreign key to projects
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                project_id INTEGER,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                UNIQUE(name, project_id)
            )
        ''')
        
        # Time entries table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS time_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME NOT NULL,
                project TEXT NOT NULL,
                task TEXT NOT NULL
            )
        ''')
        
        self.conn.commit()
        
    def insert_sample_data(self):
        # Only insert sample data if projects table is empty
        self.cursor.execute("SELECT COUNT(*) FROM projects")
        if self.cursor.fetchone()[0] == 0:
            projects = [
                ("Project A",),
                ("Project B",),
                ("Project C",),
                ("Other",)
            ]
            self.cursor.executemany("INSERT INTO projects (name) VALUES (%s)", projects)
            
            # Get project IDs
            project_tasks = {
                "Project A": ["Planning", "Development", "Testing", "Documentation"],
                "Project B": ["Research", "Implementation", "Review"],
                "Project C": ["Design", "Coding", "QA"],
                "Other": ["Meeting", "Email", "Break"]
            }
            
            for project_name, tasks in project_tasks.items():
                self.cursor.execute("""SELECT id FROM projects WHERE name=%s""", (project_name,))
                project_id = self.cursor.fetchone()[0]
                task_data = [(task, project_id) for task in tasks]
                self.cursor.executemany("INSERT INTO tasks (name, project_id) VALUES (%s, %s)", task_data)
                
            self.conn.commit()
    
    def get_obras(self):
        self.cursor.execute("""SELECT cod_obra FROM "Obra" ORDER BY cod_obra""")
        return [row[0] for row in self.cursor.fetchall()]
    
    def get_tipos_tarefa(self):
        self.cursor.execute("""
            SELECT nome_tipo
            FROM "TipoTarefa"
            ORDER BY nome_tipo
        """)
        return [row[0] for row in self.cursor.fetchall()]
    
    def get_categorias(self):
        self.cursor.execute("""
            SELECT nome_categoria
            FROM "Categoria"
            ORDER BY nome_categoria
        """)
        return [row[0] for row in self.cursor.fetchall()]
    
    def get_project_id(self, obra_name):
        #self.cursor.execute("SELECT id_obra FROM Obra WHERE cod_obra = ?", (obra_name,))
        self.cursor.execute("""SELECT id_obra FROM "Obra" WHERE cod_obra = %s""", (obra_name,))
        result = self.cursor.fetchone()
        return result[0] if result else None
    
    def get_task_id(self, task_name):
        self.cursor.execute("""SELECT id_tipo_tarefa FROM "TipoTarefa" WHERE nome_tipo = %s""", (task_name,))
        result = self.cursor.fetchone()
        return result[0] if result else None
    
    def get_category_id(self, category_name):        
        self.cursor.execute("""SELECT id_categoria FROM "Categoria" WHERE nome_categoria = %s""", (category_name,))
        result = self.cursor.fetchone()
        return result[0] if result else None
        
    def get_nome_id(self, nome):                
        self.cursor.execute(""" SELECT id_nome FROM "Pessoa" WHERE nome = %s """, (nome,))
        result = self.cursor.fetchone()
        return result[0] if result else None
        
    
    
    def save_time_entry(self, nome, cod_obra, nome_tipo, nome_categoria, duracao_minutos, hora_extra=False):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        #print(f"hora_extra: {hora_extra} (tipo: {type(hora_extra)})")
        #print(f"hora_extra: {hora_extra} (valor de hora extra: {hora_extra})")
        
        self.cursor.execute("""
            INSERT INTO "Registro" (timestamp, id_nome, id_obra, id_tipo_tarefa, id_categoria, duracao_minutos, hora_extra)             
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (timestamp, nome, cod_obra, nome_tipo, nome_categoria, duracao_minutos, hora_extra))
        self.conn.commit()
    
    def close(self):
        self.conn.close()

class ProjectTrackingWindow:
    def __init__(self, parent, db_manager, config, timer_instance=None, custom_duration=60):
        #self.parent = parent  # Store reference to parent window
        self.window = tk.Toplevel(parent)
        self.window.title("Registre a Tarefa!")
        self.db_manager = db_manager
        self.config = config  # Adicione esta linha
        self.timer_instance = timer_instance  # Store the timer instance
        self.custom_duration = custom_duration  # Add this line
        self.cursor = self.db_manager.conn.cursor() #para permitir queries.. precisa mesmo?
        
        
        # Set window size and center it
        window_width = 300
        window_height = 290
        screen_width = self.window.winfo_screenwidth()
        screen_height = self.window.winfo_screenheight()
        center_x = int(screen_width/2 - window_width/2)
        center_y = int(screen_height/2 - window_height/2)
        self.window.geometry(f'{window_width}x{window_height}+{center_x}+{center_y}')
        
        # Make window modal
        self.window.transient(parent)
        self.window.grab_set()
        
        #teste para alerta
        self.window.attributes('-topmost', True)  # Sempre no topo
        #self.window.grab_set()  # Bloqueia interação com outras janelas

        # Estilo para tornar incômodo
        #self.window.configure(bg='red')
        
        self.setup_gui()
        

    
    # def verificar_hora_extra(self, hora_extra_checkbox):     
        # agora = datetime.now() # Obtém a data e hora atual    
        # fim_de_semana = agora.weekday() >= 5 # Verifica se hoje é sábado (5) ou domingo (6)     
        # depois_das_dezenove = agora.hour > 19 # Verifica se a hora atual é maior que 19h 
        
        # #Se for fim de semana ou hora atual é além das 19h, marca a checkbox 'hora extra?' 
        # if fim_de_semana or depois_das_dezenove:
            # self.hora_extra_checkbox.select() # Marca a caixa de seleção
        # else:
            # self.hora_extra_checkbox.deselect() # Desmarca a caixa de seleção

    def setup_gui(self):
        # Project selection
        project_frame = tk.Frame(self.window)
        project_frame.pack(pady=10, padx=20, fill=tk.X)
        
        tk.Label(project_frame, text="Projeto:").pack(anchor=tk.W)
        self.project_var = tk.StringVar()
        # Get projects with combined cod_obra and nome_obra
        self.cursor.execute("""SELECT cod_obra || ' - ' || nome_obra FROM "Obra" ORDER BY cod_obra""")
        project_values = [row[0] for row in self.cursor.fetchall()]
        
        self.project_dropdown = ttk.Combobox(
            project_frame, 
            textvariable=self.project_var,
            values=project_values,
            state="readonly"
        )
        self.project_dropdown.pack(fill=tk.X)
        self.project_dropdown.bind('<<ComboboxSelected>>', self.update_tasks)
        
        
        # Task selection
        task_frame = tk.Frame(self.window)
        task_frame.pack(pady=10, padx=20, fill=tk.X)
        
        tk.Label(task_frame, text="Tarefa:").pack(anchor=tk.W)
        self.task_var1 = tk.StringVar()
        self.task_dropdown1 = ttk.Combobox(
            task_frame,
            textvariable=self.task_var1,
            state="readonly"
        )
        self.task_dropdown1.pack(fill=tk.X)
        self.task_dropdown1.bind('<<ComboboxSelected>>', self.update_categoria)
        
        tk.Label(task_frame, text="SubTarefa:").pack(anchor=tk.W)
        self.task_var2 = tk.StringVar()
        self.task_dropdown2 = ttk.Combobox(
            task_frame,
            textvariable=self.task_var2,
            state="readonly"
        )
        self.task_dropdown2.pack(fill=tk.X)
        
        # Checkbox para hora extra
        extra_hour_frame = tk.Frame(self.window)
        extra_hour_frame.pack(pady=5, padx=20, fill=tk.X)

        self.hora_extra_var = tk.BooleanVar()
        self.hora_extra_checkbox = tk.Checkbutton(
            extra_hour_frame,
            text="Hora extra?",
            variable=self.hora_extra_var
        )
        self.hora_extra_checkbox.pack(anchor=tk.W)
        
        # OK button
        self.ok_button = tk.Button(
            self.window,
            text="OK",
            command=self.save_and_close,
            width=10
        )
        self.ok_button.pack(pady=20)
        
        # Set default values
        self.project_dropdown.set("Select Project")
        self.task_dropdown1.set("Select Task")
        self.task_dropdown2.set("Select SubTask")
        
        # Add this line at the end of the method
        self.load_last_entry()
        
    
    # def set_db_path(self):
        # db_path = filedialog.askopenfilename(title="Selecionar Banco de Dados", defaultextension=".db", filetypes=[("Database Files", "*.db")])
        # if db_path:
            # self.config['Database']['path'] = db_path
            # self.save_config()
            # messagebox.showinfo("Configuração", "Caminho do banco de dados atualizado.")
    
    
    def load_last_entry(self):
        # Get the user name from config; 'Bruno' se não houver valor no config.ini
        user_name = self.config['User'].get('name', 'Bruno')
        
        # Query to get the last entry's IDs for the current user
        self.cursor.execute("""
            SELECT id_obra, id_tipo_tarefa, id_categoria, hora_extra 
            FROM "Registro" 
            WHERE id_nome = %s 
            ORDER BY timestamp DESC 
            LIMIT 1
        """, (self.db_manager.get_nome_id(user_name),))
        
        last_entry = self.cursor.fetchone()
        #print(last_entry)
        
        if last_entry:
            last_project_id, last_task_id, last_category_id, last_hora_extra_bool = last_entry
            
            # Get text values with combined cod_obra and nome_obra
            self.cursor.execute("""SELECT cod_obra || ' - ' || nome_obra FROM "Obra" WHERE id_obra = %s""", (last_project_id,))
            last_project = self.cursor.fetchone()[0]
            
            self.cursor.execute("""SELECT nome_tipo FROM "TipoTarefa" WHERE id_tipo_tarefa = %s""", (last_task_id,))
            last_task = self.cursor.fetchone()[0]
            
            self.cursor.execute("""SELECT nome_categoria FROM "Categoria" WHERE id_categoria = %s""", (last_category_id,))
            last_category = self.cursor.fetchone()[0]

            #não vou pegar o valor de hora extra pra pessoa sempre indicar
            #self.cursor.execute("""SELECT hora_extra FROM "Registro" WHERE hora_extra = %s""", (last_hora_extra_bool,))
            #last_hora_extra = self.cursor.fetchone()[0]
            
            # Set the project dropdown
            self.project_dropdown.set(last_project)
            self.update_tasks()  # This populates task dropdown
            
            # Set the task dropdown
            self.task_dropdown1.set(last_task)
            self.update_categoria()  # This populates category dropdown
            
            # Set the category dropdown
            self.task_dropdown2.set(last_category)

            # Do not Set the hora extra checkbox, porque vai depedender da hora do dia? Ver com dayana
            #self.hora_extra_var.set(last_hora_extra)  

            
    
    
    def update_tasks(self, event=None):
        selected_project = self.project_var.get()
        
        if selected_project:
            tasks = self.db_manager.get_tipos_tarefa()
            self.task_dropdown1['values'] = tasks
            self.task_dropdown1.set("Select Task")
            self.task_dropdown2.set("Select SubTask")  # Reseta o terceiro menu
            self.task_dropdown2['values'] = []
        
        #self.task_dropdown1['values'] = self.db_manager.get_tipos_tarefa()
        #self.task_dropdown1.set("Select Task")
    
    def update_categoria(self, event=None):
        selected_task = self.task_var1.get()  # Tarefa selecionada
        if selected_task:
            categorias = self.db_manager.get_categorias()
            self.task_dropdown2['values'] = categorias
            self.task_dropdown2.set("Select SubTask")
        
        #self.task_dropdown2['values'] = self.db_manager.get_categorias()
        #self.task_dropdown2.set("Select subTask")
        
    def save_and_close(self):
        try:
            # Get the user name from parent's config
            user_name = self.config['User'].get('name', 'Bruno')
        
            # Split the project selection to get just the cod_obra
            selected_project = self.project_var.get().split(' - ')[0]        
            
            # Print out all children names
            #print("Available children:", list(self.window.master.winfo_toplevel().children.keys()))

            # Obtenha a referência da checkbox 'hora extra?'
            hora_extra_checkbox = self.hora_extra_checkbox # Certifique-se de que você tem a referência correta        
            
            # Chama a função verificar_hora_extra para marcar ou desmarcar a checkbox 
            #self.verificar_hora_extra(hora_extra_checkbox)
            
        
            # Obtenha os valores selecionados nos dropdowns
            #selected_project = self.project_var.get()
            selected_task = self.task_var1.get()
            selected_subtask = self.task_var2.get()
            #nome = "Bruno" #editar depois
            
            # Obtenha os IDs correspondentes no banco de dados
            #project_id = self.db_manager.get_project_id(selected_project)
            project_id = self.db_manager.get_project_id(selected_project)                
            task_id = self.db_manager.get_task_id(selected_task)
            category_id = self.db_manager.get_category_id(selected_subtask)
            #nome_id = self.db_manager.get_nome_id(nome)
            nome_id = self.db_manager.get_nome_id(user_name)
            #print("dados")
            #print(project_id, task_id, category_id)
            
            if project_id and task_id and category_id:
                #print(project_id, task_id, category_id)
                # Insira os dados no banco
                self.db_manager.save_time_entry(
                    #nome="Bruno",  # Ajuste para capturar o nome do usuário, se necessário
                    nome=nome_id,
                    cod_obra=project_id,
                    nome_tipo=task_id,
                    nome_categoria=category_id,
                    duracao_minutos=self.custom_duration,  # Use the custom duration
                    #hora_extra=self.hora_extra_var.get()
                    hora_extra=self.hora_extra_var.get() # Obtém o estado da checkbox
                )
                
                # Store a reference to the parent CountdownTimer
                #parent_timer = self.window.master.winfo_toplevel().children['!coundowntimer']
                
                
                
                
                messagebox.showinfo("Success", "Tarefa registrada com sucesso!", parent=self.window)
                #tirar log de sucesso depois, pra não crescer o arquivo indefinidamente
                logging.info("Registro efetuado: projeto_id=%s, task_id=%s, category_id=%s", project_id, task_id, category_id)                
                # Restart the timer automatically if timer_instance exists
                if self.timer_instance and self.custom_duration == 60:  # Only reset timer for standard duration:
                    self.timer_instance.reset_timer()
                    self.timer_instance.start_timer()
                self.window.destroy()
            else:
                messagebox.showwarning("Seleção inválida", "Selecione o projeto E a tarefa/categoria.")
                logging.warning("Seleção inválida: projeto_id=%s, task_id=%s, category_id=%s", project_id, task_id, category_id)
        except Exception as e:
            logging.error("Erro ao registrar tarefa: %s", str(e))
            messagebox.showerror("Erro", "Ocorreu um erro ao registrar a tarefa. Por favor, tente novamente.", parent=self.window)


class CountdownTimer:
    def __init__(self, root):
        self.root = root
        self.root.title("Timer Plena")
        
        self.config = self.load_config()        
        
        # Initialize database manager with retry dialog
        while True:
            self.db_manager = self.initialize_database_with_retry()
            logging.info("Conexão ao banco de dados estabelecida com sucesso.")
            
            if not self.db_manager:
                retry_dialog = RetryDialog(
                    self.root,
                    "Não foi possível conectar ao banco de dados após várias tentativas. "
                    "Verifique a conexão e tente novamente."
                )
                should_retry = retry_dialog.show()
                
                if should_retry:
                    continue  # Tenta novamente
                else:
                    logging.error("Erro ao conectar ao banco de dados")
                    self.root.destroy()  # Encerra a aplicação
                    return
            
            break  # Se conseguiu conectar, sai do loop
                
        # Set window size and center it
        window_width = 400
        window_height = 200
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        center_x = int(screen_width/2 - window_width/2)
        center_y = int(screen_height/2 - window_height/2)
        self.root.geometry(f'{window_width}x{window_height}+{center_x}+{center_y}')
        
        # Timer variables
        # Use the initial time from config, converting to an integer
        initial_time = int(self.config['Settings']['initial_time'])
        self.remaining_time = timedelta(minutes=initial_time//60)
        #self.remaining_time = timedelta(seconds=5)
        self.is_running = False
        self.after_id = None
        
        # Create GUI elements
        self.setup_gui()
        
        # Auto-start timer
        self.start_timer()
        
        # Bind cleanup on window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
    def initialize_database_with_retry(self, max_attempts=3, delay_seconds=5):
        """
        Tenta conectar ao banco de dados com reconexão.
        
        Args:
            max_attempts (int): Número máximo de tentativas de conexão.
            delay_seconds (int): Tempo de espera entre as tentativas (em segundos).
        
        Returns:
            DatabaseManager: Retorna o DatabaseManager se a conexão for bem-sucedida, None caso contrário.
        """
        attempt = 1
        while attempt <= max_attempts:
            #print(f"Tentativa de conexão {attempt} de {max_attempts}")
            logging.info(f"Tentativa de conexão {attempt} de {max_attempts}")
            try:
                db_manager = DatabaseManager(schema='dev')
                if self.check_database_connection(db_manager):
                    #print("Conectado ao banco de dados com sucesso.")
                    logging.info("Conectado ao banco de dados com sucesso.")
                    return db_manager  # <<< Se conseguiu, NÃO fecha!
                else:
                    print("Falha na verificação da conexão.")
                    db_manager.close()
                    #print("Conexão fechada após falha.")
                    logging.error("Conexão fechada após falha.")
            except Exception as e:
                #print(f"Tentativa {attempt} falhou: {e}")
                logging.error(f"Tentativa {attempt} falhou: {e}")
                try:
                    db_manager.close()
                    #print("Conexão fechada após exceção.")
                    logging.error("Conexão fechada após exceção.")
                except:
                    pass
            if attempt < max_attempts:
                #print(f"Tentando novamente em {delay_seconds} segundos...")
                logging.error(f"Tentando novamente em {delay_seconds} segundos...")
                time.sleep(delay_seconds)
            attempt += 1
        logging.error("Não foi possível conectar ao banco de dados após todas as tentativas.")
        return None

        
    def check_database_connection(self, db_manager):
        """
        Verifica se a conexão com o banco de dados está ativa e se as consultas necessárias retornam resultados.
        
        Args:
            db_manager (DatabaseManager): Instância do DatabaseManager.
        
        Returns:
            bool: True se tudo estiver ok, False caso contrário.
        """
        try:
            # Verifica se a conexão com o banco de dados está ativa
            if not db_manager.conn:
                return False
            
            # Verifica se as consultas necessárias retornam resultados
            cursor = db_manager.conn.cursor()
            #print("cursor deu certo")
            logging.info("cursor deu certo")
            
            # Verifica se há projetos no banco de dados
            cursor.execute(""" SELECT COUNT(*) FROM "Obra"; """)
            if cursor.fetchone()[0] == 0:
                return False
            
            # Verifica se há tipos de tarefa no banco de dados
            cursor.execute(""" SELECT COUNT(*) FROM "TipoTarefa"; """)
            if cursor.fetchone()[0] == 0:
                return False
            
            # Verifica se há categorias no banco de dados
            cursor.execute(""" SELECT COUNT(*) FROM "Categoria"; """)
            if cursor.fetchone()[0] == 0:
                return False
            
            return True
        
        except Exception as e:
            logging.error(f"Erro ao verificar conexão com o banco de dados: {e}")
            return False
    
    def restore_window(self, event):
        self.root.deiconify()  # Restaura a janela
        self.root.focus_force()  # Garante o foco
    
    def load_config(self):
        config = configparser.ConfigParser()
        config_file = 'config.ini'
        
        if os.path.exists(config_file):
            config.read(config_file)
        else:
            #config['Database'] = {'path': 'data.db'}
            config['Database'] = {
            'host': '192.168.15.7',
            'database': 'plena',
            'user': 'plena',
            'password': '123',
            'port': '5432'
            }
            config['Settings'] = {'initial_time': '10'}
            config['User'] = {'name': ''}  # Add a user section
            with open(config_file, 'w') as f:
                config.write(f)
        
        return config

    def save_config(self):
        with open('config.ini', 'w') as configfile:
            self.config.write(configfile)
        
    def setup_gui(self):
        # Main display label
        self.time_label = tk.Label(
            self.root,
            text=str(self.remaining_time).split(".")[0],
            font=("Arial", 48)
        )
        self.time_label.pack(pady=20)
        
        # Buttons frame
        button_frame = tk.Frame(self.root)
        button_frame.pack(pady=10)
        
        # Start/Pause button
        self.toggle_button = tk.Button(
            button_frame,
            text="Start",
            command=self.toggle_timer,
            width=10
        )
        self.toggle_button.pack(side=tk.LEFT, padx=5)
        
        # Reset button
        self.reset_button = tk.Button(
            button_frame,
            text="Reset",
            command=self.reset_timer,
            width=10
        )
        self.reset_button.pack(side=tk.LEFT, padx=5)
        
        self.create_menu()
        
    def create_menu(self):
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)

        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Arquivo", menu=file_menu)
        file_menu.add_command(label="Sair", command=self.root.quit)

        # Settings menu
        settings_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Configurações", menu=settings_menu)
        #settings_menu.add_command(label="Configurar Banco de Dados", command=self.set_db_path)
        
        settings_menu.add_command(label="Configurar Tempo Inicial", command=self.set_initial_time)
        settings_menu.add_command(label="Selecionar Usuário", command=self.set_user_name)  # New menu item
        
        # menu de apontar horas
        horas_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Apontar", menu=horas_menu)
        horas_menu.add_command(label="Apontar hora parcial", command=self.hora_parcial)
        horas_menu.add_command(label="Verificar lançamentos", command=self.show_daily_entries)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Ajuda", menu=help_menu)
        help_menu.add_command(label="Sobre...", command=self.show_about)
        #help_menu.add_command(label="Atualização...", command=self.check_and_update)
    
    def show_daily_entries(self):
            """
            Abre a janela para exibir os lançamentos do dia.
            """
            qtdedias = simpledialog.askinteger(                
                "Verificar lançamentos",
                "Informe quantidade de dias:",
                parent=self.root,
                minvalue=1,
                maxvalue=60                
            )
            DailyEntriesWindow(self.root, self.db_manager, self.config, initvalue=qtdedias)    
        
    
    
    def show_about(self):
        AboutDialog(self.root)
    
    # Add this method to the CountdownTimer class
    def hora_parcial(self):
        # Create a dialog to get minutes from user   
        #usa como valor inicial 60 minutos menos o valor atual do cronometro
        valor = int(60 - (self.remaining_time.total_seconds() / 60))
        duration2 = simpledialog.askinteger(
            "Apontar Hora Parcial",
            "Digite a duração em minutos:",
            initialvalue=valor,
            parent=self.root,
            minvalue=1,
            maxvalue=60
        )
        
        if duration2:
            # Create ProjectTrackingWindow with custom duration
            ProjectTrackingWindow(
                self.root, 
                self.db_manager, 
                self.config, 
                self,
                custom_duration=duration2  # Pass the custom duration
            )

        
    # def set_db_path(self):
        # db_path = filedialog.askopenfilename(title="Selecionar Banco de Dados", defaultextension=".db", filetypes=[("Database Files", "*.db")])
        # if db_path:
            # self.config['Database']['path'] = db_path
            # self.save_config()
            # messagebox.showinfo("Configuração", "Caminho do banco de dados atualizado.")
    
    def set_user_name(self):
        # Get list of names from the database
        self.cursor = self.db_manager.conn.cursor()
        self.cursor.execute("""SELECT nome FROM "Pessoa" ORDER BY nome""")
        user_names = [row[0] for row in self.cursor.fetchall()]
        
        # Create a dialog for user selection
        user_name = simpledialog.askstring(
            "Selecionar Usuário", 
            "Escolha seu nome:", 
            initialvalue=self.config['User'].get('name', ''),
            parent=self.root
        )
        
        if user_name and user_name in user_names:
            self.config['User']['name'] = user_name
            self.save_config()
            messagebox.showinfo("Configuração", f"Usuário definido como {user_name}")
        elif user_name:
            messagebox.showerror("Erro", "Nome de usuário não encontrado no banco de dados.")
    
    def set_initial_time(self):
        time_input = simpledialog.askinteger(
            "Configurar Tempo Inicial", 
            "Insira o tempo inicial em minutos:", 
            initialvalue=int(self.config['Settings']['initial_time'])//60
        )
        if time_input is not None:
            # Convert minutes to seconds before saving
            seconds = time_input * 60
            self.config['Settings']['initial_time'] = str(seconds)
            self.save_config()
            self.remaining_time = timedelta(minutes=time_input)
            self.update_display()
            messagebox.showinfo("Configuração", "Tempo inicial atualizado.")
            
    def toggle_timer(self):
        if self.is_running:
            self.pause_timer()
        else:
            self.start_timer()
            
    def start_timer(self):
        self.is_running = True
        self.toggle_button.config(text="Pause")
        self.update_timer()
        
    def pause_timer(self):
        self.is_running = False
        self.toggle_button.config(text="Start")
        if self.after_id:
            self.root.after_cancel(self.after_id)
            
    def reset_timer(self):
        self.pause_timer()
        # Use the initial time from config, converting to an integer
        initial_time = int(self.config['Settings']['initial_time'])
        self.remaining_time = timedelta(minutes=initial_time//60)
        self.update_display()
        
    def update_timer(self):
        if self.is_running and self.remaining_time > timedelta(0):
            self.remaining_time -= timedelta(seconds=1)
            self.update_display()
            self.after_id = self.root.after(1000, self.update_timer)
        elif self.remaining_time <= timedelta(0):
            self.timer_complete()
            
    def update_display(self):
        self.time_label.config(text=str(self.remaining_time).split(".")[0])
        
       
        
    def timer_complete(self):
        self.pause_timer()
        self.time_label.config(text="Fim!")
        self.root.bell()
        self.root.deiconify()
        self.root.focus_force()
        
        # Loop para tentar conectar ao banco de dados
        while True:
            if not self.check_database_connection(self.db_manager):
                # Criar e mostrar a caixa de diálogo de retry
                retry_dialog = RetryDialog(
                    self.root,
                    "Não foi possível conectar ao banco de dados ou os dados necessários não foram encontrados. "
                    "Verifique a conexão e tente novamente."
                )
                should_retry = retry_dialog.show()
                
                if should_retry:
                    # Tentar reinicializar o banco de dados
                    self.db_manager = self.initialize_database_with_retry()
                    if self.db_manager:
                        continue  # Se conseguiu conectar, continua o loop para verificar a conexão
                else:
                    return  # Se o usuário cancelou, sai da função
            
            # Se chegou aqui, a conexão está ok
            break
        
        # Se a verificação for bem-sucedida, abre a janela de apontamento de horas
        ProjectTrackingWindow(self.root, self.db_manager, self.config, self)
    
    def on_closing(self):
        self.db_manager.close()
        self.root.destroy()



def main():
    root = tk.Tk()
    app = CountdownTimer(root)
    root.bind("<Map>", app.restore_window)  # Vincula o evento ao método da classe    
    root.mainloop()

if __name__ == "__main__":
    main()
