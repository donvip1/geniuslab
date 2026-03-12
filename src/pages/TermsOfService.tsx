import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <>
      <SEOHead
        title="Terms of Service – GeniusLab CBT"
        description="Terms of Service for GeniusLab CBT Application. Read the terms and conditions for using our platform."
      />
      <Navbar />
      <main className="min-h-screen pt-20 pb-10 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-4">Last updated: March 12, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using the GeniusLab CBT application ("App") operated by GeniusLab Educational Consult ("we", "our", "us"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">2. Description of Service</h2>
            <p>GeniusLab CBT provides computer-based test (CBT) practice for Nigerian examinations including JAMB UTME, WAEC, NECO, NABTEB, and university departmental exams. The service includes practice questions, exam simulations, performance tracking, study materials, and leaderboards.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must not share your account or access pins with others</li>
              <li>You must be at least 13 years old to create an account, or have parental consent</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">4. Free & Paid Services</h2>
            <p>GeniusLab CBT offers both free and paid tiers:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Free Tier:</strong> Access to limited questions and features with advertisements displayed via Google AdMob/AdSense</li>
              <li><strong>Paid/Activated Tier:</strong> Full access to all questions, ad-free experience, and premium features upon payment or activation via access pin</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">5. Payments & Refunds</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Payments are processed securely via Paystack or manual bank transfer</li>
              <li>Subscription access is granted immediately upon successful payment or pin activation</li>
              <li>Refunds may be considered on a case-by-case basis within 24 hours of payment if the service was not used</li>
              <li>Access pins are non-refundable once used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">6. Intellectual Property</h2>
            <p>All content in the App, including questions, explanations, study materials, graphics, and software, is the property of GeniusLab Educational Consult or its licensors. You may not reproduce, distribute, or create derivative works from our content without written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">7. Prohibited Conduct</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Attempting to access other users' accounts or data</li>
              <li>Scraping, copying, or redistributing questions and content</li>
              <li>Using automated tools or bots to interact with the App</li>
              <li>Sharing access pins or circumventing payment requirements</li>
              <li>Engaging in any activity that disrupts the App's functionality</li>
              <li>Submitting false or misleading information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">8. Disclaimer of Warranties</h2>
            <p>The App is provided "as is" without warranties of any kind. We do not guarantee that questions will appear on actual examinations. GeniusLab CBT is a practice tool and should be used alongside other study resources.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">9. Limitation of Liability</h2>
            <p>GeniusLab Educational Consult shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App. Our total liability shall not exceed the amount you paid for the service in the preceding 12 months.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">10. Account Restrictions</h2>
            <p>We reserve the right to restrict, suspend, or ban user accounts for violations of these terms. Restricted users will be notified of the reason and duration of restriction.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">11. Modifications to Terms</h2>
            <p>We may update these Terms of Service at any time. Continued use of the App after changes constitutes acceptance of the new terms. We will notify users of significant changes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">12. Governing Law</h2>
            <p>These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Ekiti State, Nigeria.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">13. Contact Us</h2>
            <p>For questions about these Terms of Service:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: <a href="mailto:Geniuslabeducational@gmail.com" className="text-primary underline">Geniuslabeducational@gmail.com</a></li>
              <li>Phone: +2348124269495</li>
            </ul>
          </section>

          <section className="mt-8 pt-4 border-t">
            <p>See also our <Link to="/privacy-policy" className="text-primary underline">Privacy Policy</Link>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TermsOfService;
