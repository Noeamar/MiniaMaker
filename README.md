# 🎨 MiniaMaker — AI-Powered YouTube Thumbnail Generator

MiniaMaker is a modern web application that helps creators generate high-impact YouTube thumbnails using AI.  
Users can write custom prompts, use guided templates, upload reference images, and generate multiple thumbnail variations instantly.

---

## 🚀 Features

### 🧠 AI Thumbnail Generation
- Generate high-quality YouTube thumbnails with AI.
- Accepts **custom user prompts** or **structured guided templates**.
- Automatically applies **best practices** for YouTube thumbnails:
  - Strong contrast  
  - Large, bold text  
  - Expressive facial emotions  
  - Clean composition  
  - High click-through-rate optimization  

### 🖼️ Image Uploads
- Upload reference images (faces, logos, screenshots).
- Images are incorporated into the final AI generation request.
- Supports multiple uploaded assets per generation.

### ✍️ Prompt Builder & Guided Templates
- A clean template editor (like Notion blocks).
- Lets users define:
  - Video context  
  - Thumbnail objective  
  - Main subject  
  - Emotion / tone  
  - Text overlay  
  - Visual style  
  - Format preferences  
- Templates can be saved, reused, and customized.

### 🎥 Multiple Thumbnail Formats
Choose the output ratio:
- 16:9 (YouTube standard)
- 1:1
- 9:16 (Shorts / TikTok)
- Custom ratio
- Optional logo overlay & branding settings

### 🎯 Themes (Persistent Preferences)
- Create “themes” for specific types of videos (e.g., Finance, Gaming, Tech).
- Each theme stores:
  - Style preferences  
  - Color schemes  
  - Generated thumbnails  
  - Favorite thumbnails  
  - Behavioral memory of what the user prefers  
- Themes help personalizing future generations.

### 🌓 Modern UI & UX
- Built with React + Tailwind + shadcn UI.
- Clean, responsive layout.
- Smooth generation flow with a **progress bar** (percentage-based).

---

## 🔐 Authentication
Users can sign in using:
- Google  
- Apple  
- Microsoft  
- GitHub  
- Email/password  

Accounts allow saving templates, themes, generation history, and preferences.

---

## 💳 Billing & Credits
MiniaMaker includes a full monetization system:

### Subscription plans
- Free tier  
- Pro Monthly  
- Pro Yearly (discounted)

### Credit system
- Each generation consumes credits.
- Users can:
  - Buy credit packs  
  - Upgrade to subscriptions  
  - View payment history  

Integrated with **Stripe Checkout & Stripe Customer Portal**.

---

## 📊 Dashboard
A user dashboard shows:
- Total thumbnails generated  
- Credits remaining  
- Monthly usage graph  
- Favorite thumbnails  
- Activity timeline  

---

## 🧱 Tech Stack

- **React**
- **Vite**
- **TypeScript**
- **TailwindCSS**
- **shadcn/ui**
- **Stripe API**
- **AI Backend (Gemini / custom API)**

---

## 🛠️ Local Development

```sh
git clone https://github.com/Noeamar/MiniaMaker.git
cd MiniaMaker
npm install
npm run dev
