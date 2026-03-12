import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const PrivacyPolicy = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy – GeniusLab CBT"
        description="Privacy Policy for GeniusLab CBT Application. Learn how we collect, use, and protect your data."
      />
      <Navbar />
      <main className="min-h-screen pt-20 pb-10 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">Last updated: March 12, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">1. Introduction</h2>
            <p>GeniusLab Educational Consult ("we", "our", "us") operates the GeniusLab CBT application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App available on the Google Play Store and our website at <a href="https://geniuslabz.xyz" className="text-primary underline">geniuslabz.xyz</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">2. Information We Collect</h2>
            <h3 className="text-lg font-medium mt-4 mb-1">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full name and email address (when you create an account)</li>
              <li>Username (optional)</li>
              <li>Payment information (processed securely via Paystack; we do not store card details)</li>
            </ul>
            <h3 className="text-lg font-medium mt-4 mb-1">Usage Data</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Exam scores, answers, and performance history</li>
              <li>Pages visited within the App</li>
              <li>Device information and browser type</li>
              <li>Session identifiers for analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To create and manage your account</li>
              <li>To provide CBT practice exams and track your performance</li>
              <li>To process payments and manage subscriptions</li>
              <li>To display relevant advertisements to free-tier users via Google AdMob/AdSense</li>
              <li>To improve our App and develop new features</li>
              <li>To communicate with you about updates and support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">4. Advertising</h2>
            <p>We use Google AdMob and Google AdSense to display advertisements to users on the free tier. These services may collect device identifiers and usage data to serve personalized ads. Paid/activated users do not see any advertisements. You can opt out of personalized advertising through your device settings or by visiting <a href="https://adssettings.google.com" className="text-primary underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">5. Data Sharing & Third Parties</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Service Providers:</strong> Cloud hosting, payment processors (Paystack), and analytics services that help us operate the App</li>
              <li><strong>Advertising Partners:</strong> Google AdMob/AdSense for serving ads to free-tier users</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">6. Data Security</h2>
            <p>We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS), secure authentication, and row-level security on our databases. However, no method of electronic storage is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">7. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active. You may request deletion of your account and associated data by contacting us at the email below.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">8. Children's Privacy</h2>
            <p>Our App is intended for students preparing for examinations. We do not knowingly collect personal information from children under the age of 13 without parental consent. If you believe we have collected such data, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">9. Your Rights</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access, correct, or delete your personal data</li>
              <li>Opt out of personalized advertising</li>
              <li>Request a copy of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: <a href="mailto:Geniuslabeducational@gmail.com" className="text-primary underline">Geniuslabeducational@gmail.com</a></li>
              <li>Phone: +2348124269495</li>
              <li>Address: Federal University Oye Ekiti, Nigeria</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
