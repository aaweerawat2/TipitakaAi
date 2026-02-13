# 🚀 วิธี Build APK บน GitHub Actions

## ขั้นตอนที่ 1: สร้าง GitHub Repository

1. ไปที่ https://github.com/new
2. ตั้งชื่อ repository เช่น `tripitaka-offline-ai`
3. เลือก **Public** (ฟรี 2000 นาที/เดือน)
4. กด **Create repository**

---

## ขั้นตอนที่ 2: Push โปรเจคไป GitHub

```bash
# แตกไฟล์ zip
unzip tripitaka-offline-ai-v1.0.0.zip -d tripitaka-offline-ai
cd tripitaka-offline-ai

# Initialize git
git init
git add .
git commit -m "Initial commit - Tripitaka Offline AI"

# เชื่อมต่อกับ GitHub (เปลี่ยน USERNAME เป็นชื่อของคุณ)
git remote add origin https://github.com/USERNAME/tripitaka-offline-ai.git
git branch -M main
git push -u origin main
```

---

## ขั้นตอนที่ 3: Build APK

### วิธีที่ 1: Auto Build (push แล้ว build อัตโนมัติ)
ทุกครั้งที่ push ไป `main` branch GitHub Actions จะ build APK อัตโนมัติ

### วิธีที่ 2: Manual Build (กด build เอง)
1. ไปที่ repository ของคุณ
2. คลิก tab **Actions**
3. เลือก **Build Android APK** จาก sidebar
4. คลิก **Run workflow** → **Run workflow**

---

## ขั้นตอนที่ 4: ดาวน์โหลด APK

1. รอประมาณ 10-15 นาที
2. คลิกที่ workflow run ที่เสร็จแล้ว
3. Scroll ลงล่างสุดที่ **Artifacts**
4. คลิก **app-debug** เพื่อดาวน์โหลด APK

---

## 📱 ติดตั้ง APK บน Android

1. ถอน zip ไฟล์ที่ดาวน์โหลดมา
2. เปิด `app-debug.apk`
3. อนุญาต "Install from unknown sources" ถ้าถาม
4. กด **Install**

---

## 🔧 การแก้ไขปัญหา

### Build Failed
1. ไปที่ Actions → คลิก workflow run ที่ fail
2. อ่าน error message
3. แก้ไข code และ push ใหม่

### Common Issues
- **Java version**: ต้องใช้ Java 17+
- **Android SDK**: ต้องใช้ Build Tools 34.0.0
- **Node version**: ต้องใช้ Node 18+

---

## 💡 Tips

### เพิ่ม Badge ใน README
```markdown
![Build APK](https://github.com/USERNAME/tripitaka-offline-ai/actions/workflows/build-apk.yml/badge.svg)
```

### สร้าง Release
```bash
git tag v1.0.0
git push origin v1.0.0
```
จะสร้าง release พร้อม APK อัตโนมัติ

---

## 📊 GitHub Actions Limits (Free Tier)

| ประเภท | Limit |
|--------|-------|
| Public repo | ไม่จำกัด |
| Private repo | 2000 นาที/เดือน |
| Storage | 500MB |

---

## ⏱️ เวลา Build โดยประมาณ

| ขั้นตอน | เวลา |
|---------|------|
| Setup environment | ~2 นาที |
| Install dependencies | ~3 นาที |
| Build APK | ~5-10 นาที |
| **รวม** | **~10-15 นาที** |
