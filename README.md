# 📿 Tripitaka-Offline-AI

แอปพลิเคชันอ่านพระไตรปิฎกภาษาไทย พร้อมผู้ช่วย AI ที่ทำงานได้โดยไม่ต้องเชื่อมต่ออินเทอร์เน็ต

## ✨ คุณสมบัติหลัก

### 📖 การอ่านพระไตรปิฎก
- อ่านพระสูตรภาษาไทยทั้งหมดออฟไลน์
- ค้นหาด้วยข้อความ (Full-text Search)
- ปรับแต่งการแสดงผล (ขนาดอักษร, ฟอนต์, ธีม)
- บุ๊คมาร์กและประวัติการอ่าน

### 🤖 AI ถาม-ตอบ
- ถามคำถามเกี่ยวกับพระธรรม
- อ้างอิงจากพระสูตรจริง (RAG)
- ทำงานได้ออฟไลน์ 100%
- รองรับ NPU สำหรับประสิทธิภาพสูงสุด

### 🎤 คุณสมบัติเสียง
- พูดถามด้วยเสียง (ASR - Thai Whisper)
- ฟังคำตอบด้วยเสียง (TTS - Thai VITS)
- เลือกเสียงได้หลายแบบ (หญิง, ชาย, พระ)
- ปรับความเร็วและระดับเสียง

### 📁 เพิ่มข้อมูลเอง
- นำเข้าเอกสาร PDF, TXT, DOCX
- เพิ่มความรู้เข้าสู่ระบบ RAG
- ค้นหาจากเอกสารที่เพิ่มเอง

---

## 🛠️ เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|------|----------|
| Frontend | React Native + TypeScript |
| Styling | NativeWind (Tailwind CSS) |
| State | Zustand |
| Database | SQLite + FTS5 + Vector Search |
| AI Inference | ExecuTorch (NPU-accelerated) |
| LLM | Llama 3.2 1B (Thai) |
| ASR | Whisper Small/Tiny (Thai) |
| TTS | VITS Thai / Piper / System TTS |

---

## 📦 ข้อกำหนดของระบบ

### Android
- Android 8.0 (API 26) ขึ้นไป
- RAM 4GB ขึ้นไป (แนะนำ 6GB+)
- พื้นที่ว่าง 1.5GB สำหรับโมเดล

### iOS
- iOS 14.0 ขึ้นไป
- iPhone 12 ขึ้นไป (แนะนำสำหรับ Neural Engine)
- พื้นที่ว่าง 1.5GB สำหรับโมเดล

---

## 🚀 การติดตั้งและ Build

### ข้อกำหนดเบื้องต้น

```bash
# Node.js 18+
node --version

# Bun (recommended) or npm
bun --version

# EAS CLI
npm install -g eas-cli
```

### 1. Clone และติดตั้ง Dependencies

```bash
cd tripitaka-offline-ai
bun install
```

### 2. เตรียมข้อมูลพระไตรปิฎก

```bash
# ติดตั้ง Python dependencies
pip install -r scripts/requirements.txt

# ดาวน์โหลดและสกัดข้อมูล
python3 scripts/1_extract_tripitaka.py

# แบ่งข้อความและสร้าง embeddings
python3 scripts/2_chunking_embedding.py

# สร้างฐานข้อมูล SQLite
python3 scripts/3_build_sqlite.py
```

### 3. ดาวน์โหลดโมเดล AI

```bash
# ดาวน์โหลดโมเดล LLM
bun run download-models
```

หรือดาวน์โหลดด้วยตนเองจาก:
- **LLM**: [Llama 3.2 1B ExecuTorch](https://huggingface.co/executorch-community/Llama-3.2-1B-Instruct-SpinQuant_INT4_EO8-ET)
- **ASR**: [Thonburian Whisper](https://github.com/biodatlab/thonburian-whisper)
- **TTS**: [thaitts-onnx](https://github.com/PyThaiNLP/thaitts-onnx)

### 4. Build APK ด้วย EAS

```bash
# Login to EAS
eas login

# Configure project
eas build:configure

# Build preview APK
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production
```

---

## 📁 โครงสร้างโปรเจค

```
tripitaka-offline-ai/
├── android/              # Android native code
├── ios/                  # iOS native code
├── assets/
│   ├── models/           # AI models (.pte, .onnx)
│   │   ├── llm/
│   │   ├── asr/
│   │   └── tts/
│   ├── database/         # SQLite database
│   └── fonts/            # Thai fonts
├── scripts/              # Python data preparation
│   ├── 1_extract_tripitaka.py
│   ├── 2_chunking_embedding.py
│   └── 3_build_sqlite.py
├── src/
│   ├── components/       # UI components
│   ├── screens/          # App screens
│   ├── services/         # Core services
│   ├── store/            # Zustand stores
│   ├── hooks/            # Custom hooks
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities
├── App.tsx               # Entry point
├── package.json
├── eas.json              # EAS Build config
├── metro.config.js       # Metro bundler config
└── tailwind.config.js    # Tailwind/NativeWind config
```

---

## 🔧 Configuration

### App Configuration (app.json)
```json
{
  "expo": {
    "name": "พระไตรปิฎก AI",
    "slug": "tripitaka-offline-ai",
    "version": "1.0.0"
  }
}
```

### EAS Build Profiles (eas.json)
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "apk" }
    }
  }
}
```

---

## 📊 ขนาดไฟล์โมเดล

| โมเดล | ขนาด | หมายเหตุ |
|-------|------|----------|
| Llama 3.2 1B | ~600 MB | LLM หลัก |
| Whisper Small Thai | ~244 MB | ASR แม่นยำ |
| Whisper Tiny Thai | ~39 MB | ASR เร็ว |
| VITS Thai | ~50 MB | TTS เสียงธรรมชาติ |
| Database | ~200 MB | พระไตรปิฎก + embeddings |
| **รวม** | **~1.1 GB** | Standard configuration |

---

## 🧪 Testing

```bash
# Run tests
bun test

# Type checking
bun run type-check

# Linting
bun run lint
```

---

## 📝 License

MIT License - ดูรายละเอียดใน [LICENSE](LICENSE)

---

## 🙏 กิตติกรรมประกาศ

### ข้อมูลพระไตรปิฎก
- [tripitaka91](https://github.com/jackchalat/tripitaka91) - ข้อมูลพระไตรปิฎกภาษาไทย
- [SuttaCentral](https://suttacentral.net) - ข้อมูลอ้างอิง

### โมเดล AI
- [ExecuTorch](https://pytorch.org/executorch) - On-device AI inference
- [Thonburian Whisper](https://github.com/biodatlab/thonburian-whisper) - Thai ASR
- [PyThaiNLP](https://github.com/PyThaiNLP/thaitts-onnx) - Thai TTS

---

## 📞 ติดต่อ

หากมีคำถามหรือข้อเสนอแนะ กรุณาสร้าง Issue ใน GitHub repository

---

**สาธุ! 🙏**
