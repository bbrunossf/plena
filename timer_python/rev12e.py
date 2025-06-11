"""
Alteração na conexão com o banco de dados, sem manter as conexões ativas
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
            text="Versão 12e (postgres)",
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
        # Usa o novo método
        entries = self.db_manager.get_daily_entries(user_id, dias)
        
        # Limpa a tabela antes de adicionar novos dados
        for row in self.tree.get_children():
            self.tree.delete(row)        
                
        # Adiciona os lançamentos na tabela
        for row in entries:
            self.tree.insert("", tk.END, values=row)
        
        
        # Exibe uma mensagem se não houver lançamentos
        if not self.tree.get_children():
            messagebox.showinfo("Informação", "Nenhum lançamento encontrado para o dia de hoje.")





class DatabaseManager:
    def __init__(self, schema='public'):
        self.schema = schema
        self.connection_params = {
            'user': "plena",
            'password': "123", 
            'database': "plena",
            'host': "192.168.15.7",
            'port': 5432
        }
        # try:
            # logging.info(f"Inicializando DatabaseManager com schema: {schema}")
            ##Teste inicial de conexão
            # self.test_connection()
            # logging.info("DatabaseManager inicializado com sucesso")
        # except Exception as e:
            # logging.error(f"Erro ao inicializar DatabaseManager: {e}")
            # messagebox.showerror("Erro de Inicialização", f"Erro ao inicializar DatabaseManager: {e}")
            # raise

    def get_connection(self):
        """Cria uma nova conexão com o banco de dados."""
        try:
            conn = pg8000.connect(**self.connection_params)
            cursor = conn.cursor()
            # Define o search_path
            cursor.execute(f"SET search_path TO {self.schema}")
            conn.commit()
            return conn, cursor
        except pg8000.Error as e:
            logging.error(f"Erro de PostgreSQL ao conectar: {e}")
            raise
        except Exception as e:
            logging.error(f"Erro geral ao conectar ao banco: {e}")
            raise

    def test_connection(self):
        """Testa a conexão com o banco de dados."""
        conn = None
        try:
            conn, cursor = self.get_connection()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            logging.info("Teste de conexão bem-sucedido")
        finally:
            if conn:
                conn.close()

    def execute_query(self, query, params=None, fetch_one=False, fetch_all=False, process_fetch_all=False):
        """
        Executa uma query e retorna os resultados.
        
        Args:
            query: SQL query para executar
            params: Parâmetros para a query
            fetch_one: Se True, retorna apenas um resultado
            fetch_all: Se True, retorna todos os resultados
        
        Returns:
            Resultado da query ou None
        """
        conn = None
        try:
            conn, cursor = self.get_connection()
            cursor.execute(query, params or ())
            
            if fetch_one:
                return cursor.fetchone()
            elif fetch_all:
                return cursor.fetchall()
            elif process_fetch_all:
                return [row[0] for row in self.cursor.fetchall()]
            else:
                conn.commit()
                return cursor.rowcount
        except Exception as e:
            if conn:
                conn.rollback()
            logging.error(f"Erro ao executar query: {e}")
            raise
        finally:
            if conn:
                conn.close()                
            
        
    def get_obras(self):
        query = """SELECT cod_obra FROM "Obra" ORDER BY cod_obra"""
        results = self.execute_query(query, fetch_all=True)
        return [row[0] for row in results] if results else []
    
    def get_tipos_tarefa(self):
        query ="""
            SELECT nome_tipo
            FROM "TipoTarefa"
            ORDER BY nome_tipo
        """
        results = self.execute_query(query, fetch_all=True)
        return [row[0] for row in results] if results else []
    
    def get_categorias(self):
        query = """
            SELECT nome_categoria
            FROM "Categoria"
            ORDER BY nome_categoria
        """
        results = self.execute_query(query, fetch_all=True)
        return [row[0] for row in results] if results else []
    
    def get_project_id(self, obra_name):
        query = """SELECT id_obra FROM "Obra" WHERE cod_obra = %s"""
        result = self.execute_query(query, (obra_name,), fetch_one=True)
        return result[0] if result else None
    
    def get_task_id(self, task_name):
        query = """SELECT id_tipo_tarefa FROM "TipoTarefa" WHERE nome_tipo = %s"""
        result = self.execute_query(query, (task_name,), fetch_one=True)
        return result[0] if result else None
    
    def get_category_id(self, category_name):        
        query = """SELECT id_categoria FROM "Categoria" WHERE nome_categoria = %s"""
        result = self.execute_query(query, (category_name,), fetch_one=True)
        return result[0] if result else None
        
    def get_nome_id(self, nome):                
        query = """SELECT id_nome FROM "Pessoa" WHERE nome = %s"""
        result = self.execute_query(query, (nome,), fetch_one=True)
        return result[0] if result else None
        
    
    
    def save_time_entry(self, nome, cod_obra, nome_tipo, nome_categoria, duracao_minutos, hora_extra=False):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        query = """
            INSERT INTO "Registro" (timestamp, id_nome, id_obra, id_tipo_tarefa, id_categoria, duracao_minutos, hora_extra)             
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (timestamp, nome, cod_obra, nome_tipo, nome_categoria, duracao_minutos, hora_extra)
        self.execute_query(query, params)
    
    def get_daily_entries(self, user_id, days_back):
        """Obtém os lançamentos dos últimos N dias para um usuário."""
        today = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
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
        return self.execute_query(query, (user_id, today), fetch_all=True)

    def get_last_entry(self, user_id):
        """Obtém o último lançamento de um usuário."""
        query = """
            SELECT id_obra, id_tipo_tarefa, id_categoria, hora_extra 
            FROM "Registro" 
            WHERE id_nome = %s 
            ORDER BY timestamp DESC 
            LIMIT 1
        """
        return self.execute_query(query, (user_id,), fetch_one=True)

    def get_obra_details(self, obra_id):
        """Obtém detalhes de uma obra pelo ID."""
        query = """SELECT cod_obra || ' - ' || nome_obra FROM "Obra" WHERE id_obra = %s"""
        result = self.execute_query(query, (obra_id,), fetch_one=True)
        return result[0] if result else None

    def get_task_name(self, task_id):
        """Obtém nome da tarefa pelo ID."""
        query = """SELECT nome_tipo FROM "TipoTarefa" WHERE id_tipo_tarefa = %s"""
        result = self.execute_query(query, (task_id,), fetch_one=True)
        return result[0] if result else None

    def get_category_name(self, category_id):
        """Obtém nome da categoria pelo ID."""
        query = """SELECT nome_categoria FROM "Categoria" WHERE id_categoria = %s"""
        result = self.execute_query(query, (category_id,), fetch_one=True)
        return result[0] if result else None

    def get_user_names(self):
        """Obtém lista de nomes de usuários."""
        query = """SELECT nome FROM "Pessoa" ORDER BY nome"""
        results = self.execute_query(query, fetch_all=True)
        return [row[0] for row in results] if results else []

    def check_tables_exist(self):
        """Verifica se as tabelas necessárias existem e têm dados."""
        try:
            # Verifica se há projetos
            obras_count = self.execute_query("""SELECT COUNT(1) FROM "Obra";""", fetch_one=True)
            # if not obras_count or obras_count[0] == 0:
                # return False
            
            #Verifica se há tipos de tarefa
            # tipos_count = self.execute_query("""SELECT COUNT(*) FROM "TipoTarefa";""", fetch_one=True)
            # if not tipos_count or tipos_count[0] == 0:
                # return False
            
            #Verifica se há categorias
            # categorias_count = self.execute_query("""SELECT COUNT(*) FROM "Categoria";""", fetch_one=True)
            # if not categorias_count or categorias_count[0] == 0:
                # return False
            
            return True
        except Exception as e:
            logging.error(f"Erro ao verificar tabelas: {e}")
            return False
    
    def get_all_projects(self):
        query = """SELECT cod_obra || ' - ' || nome_obra FROM "Obra" ORDER BY cod_obra"""
        return self.execute_query(query, fetch_all=True, process_fetch_all=True)

    def close(self):
        """Método para compatibilidade. Não há conexão persistente para fechar."""
        logging.info("DatabaseManager.close() chamado - sem ação necessária com conexões sob demanda")

class ProjectTrackingWindow:
    def __init__(self, parent, db_manager, config, timer_instance=None, custom_duration=60):
        #self.parent = parent  # Store reference to parent window
        self.window = tk.Toplevel(parent)
        self.window.title("Registre a Tarefa!")
        self.db_manager = db_manager
        self.config = config  # Adicione esta linha
        self.timer_instance = timer_instance  # Store the timer instance
        self.custom_duration = custom_duration  # Add this line        
        
        
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
        # Obter projetos usando o novo método
        obras = self.db_manager.get_obras()
        project_values1 = self.db_manager.get_all_projects()
        project_values = [row[0] for row in project_values1]
        #print(project_values)
        
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
        user_id = self.db_manager.get_nome_id(user_name)
        
        if not user_id:
            return
            
        last_entry = self.db_manager.get_last_entry(user_id)
        
        if last_entry:
            last_project_id, last_task_id, last_category_id, last_hora_extra_bool = last_entry
            
            # Obter valores de texto usando os novos métodos
            last_project = self.db_manager.get_obra_details(last_project_id)
            last_task = self.db_manager.get_task_name(last_task_id)
            last_category = self.db_manager.get_category_name(last_category_id)
            
            if last_project and last_task and last_category:
                # Set the project dropdown
                self.project_dropdown.set(last_project)
                self.update_tasks()
                
                # Set the task dropdown
                self.task_dropdown1.set(last_task)
                self.update_categoria()
                
                # Set the category dropdown
                self.task_dropdown2.set(last_category)

            
    
    
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
            user_name = self.config['User'].get('name', 'Bruno')
            selected_project = self.project_var.get().split(' - ')[0]        
            selected_task = self.task_var1.get()
            selected_subtask = self.task_var2.get()
            
            # Obter IDs usando os novos métodos
            project_id = self.db_manager.get_project_id(selected_project)                
            task_id = self.db_manager.get_task_id(selected_task)
            category_id = self.db_manager.get_category_id(selected_subtask)
            nome_id = self.db_manager.get_nome_id(user_name)
            
            if project_id and task_id and category_id:
                # Salvar entrada usando o novo método
                self.db_manager.save_time_entry(
                    nome=nome_id,
                    cod_obra=project_id,
                    nome_tipo=task_id,
                    nome_categoria=category_id,
                    duracao_minutos=self.custom_duration,
                    hora_extra=self.hora_extra_var.get()
                )
                
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
            if not self.initialize_database_with_retry():
                retry_dialog = RetryDialog(self.root, "Não foi possível conectar ao banco...")
                if not retry_dialog.show():
                    self.root.destroy()
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
        for attempt in range(max_attempts):
            try:
                db_manager = DatabaseManager(schema='public')
                if db_manager.check_tables_exist():
                    return True
            except Exception as e:
                #print(f"Tentativa {attempt} falhou: {e}")
                logging.error(f"Tentativa {attempt} falhou: {e}")                            
                time.sleep(delay_seconds)            
                logging.error("Não foi possível conectar ao banco de dados após todas as tentativas.")
        return False

        
    def check_database_connection(self, db_manager):
        """
        Verifica se a conexão com o banco de dados está ativa e se as consultas necessárias retornam resultados.
        
        Args:
            db_manager (DatabaseManager): Instância do DatabaseManager.
        
        Returns:
            bool: True se tudo estiver ok, False caso contrário.
        """
        try:            
            # Verifica se as consultas necessárias retornam resultados
            return db_manager.check_tables_exist()
            #print("cursor deu certo")
            logging.info("cursor deu certo")              
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
            #DailyEntriesWindow(self.root, self.db_manager, self.config, initvalue=qtdedias)    
            db_manager = DatabaseManager()
            DailyEntriesWindow(self.root, db_manager, self.config, initvalue=qtdedias)

        
    
    
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
            db_manager = DatabaseManager()
            ProjectTrackingWindow(self.root, db_manager, self.config, self, custom_duration=duration2)


        
    # def set_db_path(self):
        # db_path = filedialog.askopenfilename(title="Selecionar Banco de Dados", defaultextension=".db", filetypes=[("Database Files", "*.db")])
        # if db_path:
            # self.config['Database']['path'] = db_path
            # self.save_config()
            # messagebox.showinfo("Configuração", "Caminho do banco de dados atualizado.")
    
    def set_user_name(self):
        user_names = DatabaseManager().get_user_names()
        
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
            try:
                if DatabaseManager().check_tables_exist():
                    break  # conexão válida
            except Exception as e:
                logging.error(f"Erro na verificação de tabelas: {e}")

            retry_dialog = RetryDialog(
                self.root,
                "Não foi possível conectar ao banco de dados ou os dados necessários não foram encontrados. "
                "Verifique a conexão e tente novamente."
            )
            if not retry_dialog.show():
                return  # Usuário cancelou

        # Se a verificação for bem-sucedida, abre a janela de apontamento de horas
        db_manager = DatabaseManager()
        ProjectTrackingWindow(self.root, db_manager, self.config, self)

    
    
    def on_closing(self):
        #self.db_manager.close()
        self.root.destroy()



def main():
    root = tk.Tk()
    root.iconbitmap("icone.ico")
    app = CountdownTimer(root)
    root.bind("<Map>", app.restore_window)  # Vincula o evento ao método da classe    
    root.mainloop()

if __name__ == "__main__":
    main()
