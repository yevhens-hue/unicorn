import os
import json
import logging
import telebot
# from anthropic import Anthropic  # In a real environment, uncomment this
from skills import get_dashboard_metrics, get_buyer_status, TOOLS_SCHEMA

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- CONFIGURATION (Isolated Credentials) ---
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "mock_telegram_token")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "mock_anthropic_key")

bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN)
# client = Anthropic(api_key=ANTHROPIC_API_KEY) # Uncomment in prod

SYSTEM_PROMPT = """
Ти — Майстер-Агент проєкту Unicorn (Chief of Staff).
Твоя мета — допомагати користувачу отримувати дані з дашборду.
Ти маєш доступ до інструментів. Якщо користувач питає метрики, використовуй інструменти.
Відповідай коротко і стисло.
"""

def call_llm(user_message: str) -> str:
    """
    Simulates calling Anthropic Claude API with Tool Calling (Function Calling).
    """
    logging.info(f"Sending message to LLM: {user_message}")
    
    # --- MOCK LLM LOGIC ---
    # In reality, this would be client.messages.create(...)
    user_message = user_message.lower()
    
    if "metrics" in user_message or "метрики" in user_message or "roi" in user_message:
        # LLM decides to call a tool
        logging.info("LLM decided to call tool: get_dashboard_metrics")
        tool_result = get_dashboard_metrics()
        
        # LLM parses the tool result and creates a final answer
        data = json.loads(tool_result)
        return (f"📊 Загальні метрики на сьогодні:\n"
                f"💰 Revenue: ${data['total_revenue_usd']}\n"
                f"📈 ROI: {data['roi_percent']}%\n"
                f"📉 Return Rate: {data['return_rate_percent']}%\n"
                f"👥 Всього лідів: {data['total_leads']}")
        
    elif "buyerc" in user_message or "buyer c" in user_message:
        logging.info("LLM decided to call tool: get_buyer_status")
        tool_result = get_buyer_status("BuyerC")
        data = json.loads(tool_result)
        return (f"📌 BuyerC Status:\n"
                f"Leads: {data['leads']}\n"
                f"ROI: {data['roi_percent']}%")
        
    return "Я не зовсім зрозумів. Запитай мене про загальні метрики або статус конкретного баєра."


@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(message, "Привіт! Я твій Unicorn Copilot. Запитай мене про метрики дашборду.")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    logging.info(f"Received message from {message.from_user.username}: {message.text}")
    
    # 1. Intake
    raw_message = message.text
    
    # 2. LLM Processing & Skill Execution
    try:
        response_text = call_llm(raw_message)
    except Exception as e:
        logging.error(f"Error processing LLM: {e}")
        response_text = "⚠️ Помилка при обробці запиту."

    # 3. Output
    bot.reply_to(message, response_text)

if __name__ == "__main__":
    if TELEGRAM_BOT_TOKEN == "mock_telegram_token":
        logging.warning("⚠️ Запуск з MOCK токенами. Щоб агент працював в Telegram, додай .env файл з TELEGRAM_BOT_TOKEN.")
        
        # Запуск у CLI режимі для тестування (ізольоване оточення)
        print("--- UNICORN AGENT CLI TEST MODE ---")
        print("Type 'exit' to quit.")
        while True:
            msg = input("You: ")
            if msg.lower() == 'exit':
                break
            print(f"Agent: {call_llm(msg)}\n")
    else:
        logging.info("🚀 Unicorn Agent started polling...")
        bot.infinity_polling()
