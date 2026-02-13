# วิธี Build APK สำหรับ Tripitaka-Offline-AI

## วิธีที่ 1: ใช้ EAS Build (แนะนำ - ง่ายที่สุด)

### ขั้นตอน:
1. ติดตั้ง EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. สร้าง Expo account (ฟรี): https://expo.dev/signup

3. Login และ build:
   ```bash
   cd tripitaka-offline-ai
   eas login
   eas build --platform android --profile preview
   ```

4. รอประมาณ 10-15 นาที จะได้ลิงก์ดาวน์โหลด APK

**ข้อดี:**
- ฟรี 30 builds/เดือน
- Build บน cloud ไม่ต้องติดตั้ง Android SDK
- ได้ APK ที่ signed พร้อมติดตั้ง

---

## วิธีที่ 2: Build บนเครื่อง Local

### ข้อกำหนด:
- Node.js 18+
- Java JDK 17+
- Android SDK (Build Tools 34.0.0)
- พื้นที่ฮาร์ดดิสก์ ~10GB

### ขั้นตอน:

#### 1. ติดตั้ง Android SDK
```bash
# macOS/Linux
brew install --cask android-commandlinetools
# หรือดาวน์โหลดจาก https://developer.android.com/studio

# ตั้งค่า ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### 2. ติดตั้ง dependencies
```bash
cd tripitaka-offline-ai
bun install
```

#### 3. Build APK
```bash
cd android
./gradlew assembleDebug
```

#### 4. ไฟล์ APK จะอยู่ที่:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## วิธีที่ 3: ใช้ Android Studio

1. เปิด Android Studio
2. เลือก "Open an existing project"
3. เลือกโฟลเดอร์ `android` ในโปรเจค
4. รอ Sync Gradle
5. Build > Build Bundle(s) / APK(s) > Build APK(s)

---

## หมายเหตุสำคัญ

### Release Build (สำหรับเผยแพร่)
```bash
# สร้าง signing key
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd android
./gradlew assembleRelease
```

### ขนาด APK โดยประมาณ
- Debug build: ~50-80 MB
- Release build: ~25-40 MB
- หลังเพิ่มโมเดล AI: +900 MB

---

## ติดต่อปัญหา

หากมีปัญหา ลอง:
1. `cd android && ./gradlew clean`
2. ลบ `node_modules` และ `bun install` ใหม่
3. ตรวจสอบ Java version: `java --version` (ต้องเป็น 17+)
