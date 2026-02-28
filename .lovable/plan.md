

## Plan: Update Links, About Page & Add JAMB 2026 Popup

### Changes

#### 1. Update Footer social links (`src/components/Footer.tsx`)
- Replace placeholder `#` Facebook link with `https://www.facebook.com/share/1AZsQNp3Nr/`
- Add WhatsApp channel link: `https://whatsapp.com/channel/0029Vb6kqDVISTkQR9ZxN73x`
- Add website link: `https://geniuslabz.xyz/`
- Remove Twitter/Linkedin (or keep — will replace Twitter with WhatsApp icon, keep others)

#### 2. Update CTA WhatsApp link on homepage (`src/pages/Index.tsx`)
- Keep the existing WhatsApp direct message link as-is (it's for joining tutorials, not the channel)

#### 3. Add JAMB 2026 popup on homepage (`src/pages/Index.tsx`)
- Add a new dialog/popup that appears on page load (after short delay, e.g. 3 seconds)
- Message: "Prepare for JAMB 2026: Practice Exams Are Now Available — Participate Now."
- Include a "Participate Now" button linking to `/exam`
- Dismissable with X button
- Store in sessionStorage so it only shows once per session
- This is separate from the existing `AdvertisementPopup` component

#### 4. Update About page founder section (`src/pages/About.tsx`)
- Change "Founder" title to "Co-Founder & Lead Tutor" for Etim Nsisong Enefiok
- Update his description with the new text provided
- Add two new co-founder cards below: Robinson Nwankwuda (Mr. Wealth) and Philip Awazie (Donvip) with their titles and descriptions
- These are hardcoded cards (no profile images provided for the new co-founders)
- Rename the section header from "Our Founder" to "Our Co-Founders"

### Files to modify
1. `src/components/Footer.tsx` — Update social links
2. `src/pages/Index.tsx` — Add JAMB 2026 popup
3. `src/pages/About.tsx` — Update founder section to co-founders with new bios

