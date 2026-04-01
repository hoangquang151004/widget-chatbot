import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_db():
    try:
        con = psycopg2.connect(
            dbname='postgres',
            user='postgres',
            password='123',
            host='localhost'
        )
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = con.cursor()
        cursor.execute("CREATE DATABASE widget_chatbot_db")
        print("Database 'widget_chatbot_db' created successfully.")
        con.close()
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_db()
