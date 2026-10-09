import os
# 1. Import necessary libraries
import pandas as pd
import re
import unicodedata
from openai import OpenAI

# 2. Load the CSV file
df = pd.read_csv("documents/test.csv")
# df = df.head(10)  # Limit to first 10 for testing

# 3. Initialize the Typhoon client
client = OpenAI(
    api_key=os.environ["TYPHOON_API_KEY"],
    base_url="https://api.opentyphoon.ai/v1"
)

# 4. Define a function to extract Thai choice (ก, ข, ค, ง) from model response
def extract_thai_choices(text):
    if pd.isna(text):
        return ""

    # Normalize Unicode and clean invisible characters
    text = unicodedata.normalize("NFKC", str(text))
    text = re.sub(r'[\u200b-\u200d\uFEFF]', '', text)

    # Try ก., ข., ค., ง.
    matches = re.findall(r'\b([กขคง])\.', text)
    if matches:
        return ",".join(sorted(set(matches), key=matches.index))

    # Try (ก), (ข), (ค), (ง)
    matches = re.findall(r'\(([กขคง])\)', text)
    if matches:
        return ",".join(sorted(set(matches), key=matches.index))
    
    # Try ก, ข, ค, ง
    matches = re.findall(r'[กขคง]', text)
    if matches:
        return ",".join(sorted(set(matches), key=matches.index))

    # Try English A-D or a-d and map to Thai
    en_to_th = {'a': 'ก', 'b': 'ข', 'c': 'ค', 'd': 'ง'}
    matches = re.findall(r'\b([a-dA-D])\b', text)
    thai_matches = [en_to_th.get(m.lower()) for m in matches if m.lower() in en_to_th]
    if thai_matches:
        return ",".join(sorted(set(thai_matches), key=thai_matches.index))

    return ""

# 5. Loop through questions and get answers
answers = []
original = []
for question in df["question"]:
    response = client.chat.completions.create(
        model="typhoon-v2.1-12b-instruct",
        messages=[
            {
                "role": "system",
                "content": (
                    "คุณเป็นผู้ช่วยแพทย์ชาวไทยที่ให้ความช่วยเหลือและมีความรู้ "
                    "คุณจะได้รับข้อมูลพื้นฐานทางการแพทย์ของไทย ตามด้วยคำถามแบบเลือกตอบ "
                    "ใช้ข้อมูลเพื่อเลือกคำตอบที่ถูกต้องที่สุด "
                    "ตอบเฉพาะ ก, ข, ค, ง"
                )
            },
            {"role": "user", "content": question}
        ],
        max_tokens=512,
        temperature=0.6
    )

    answer_text = response.choices[0].message.content
    
    original.append(answer_text)

    extracted = extract_thai_choices(answer_text)
    
    answers.append(extracted)

# 6. Add extracted answers to the dataframe
df["answer"] = answers
df["question"] = original
# 7. Save result to CSV
df.to_csv("documents/test_with_answers.csv", index=False)

print("done")
