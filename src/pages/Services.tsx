import { Navbar } from "@/components/Navbar";
import { AdBannerSmart, AdInArticleSmart } from "@/components/SubscriptionAwareAd";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Users, Computer, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Services = () => {
  const services = [
    {
      title: "JAMB/UTME Tutorials",
      icon: GraduationCap,
      description: "Comprehensive preparation for Joint Admissions and Matriculation Board examinations",
      features: [
        "In-depth coverage of all JAMB subjects",
        "Past questions and solutions",
        "Exam strategies and time management",
        "Mock examinations and assessments",
      ],
      color: "text-primary",
    },
    {
      title: "University-Level Tutorials",
      icon: BookOpen,
      description: "Expert tutoring for university students across various disciplines",
      features: [
        "Mathematics, Physics, Chemistry, and more",
        "Course-specific exam preparation",
        "Assignment and project assistance",
        "Concept clarification and problem-solving",
      ],
      color: "text-secondary",
    },
    {
      title: "Private Tutoring",
      icon: Users,
      description: "One-on-one personalized instruction tailored to your learning needs",
      features: [
        "Customized learning plans",
        "Flexible scheduling",
        "Individual attention and support",
        "Progress tracking and feedback",
      ],
      color: "text-accent",
    },
    {
      title: "Computer-Based Testing (CBT)",
      icon: Computer,
      description: "Practice with our state-of-the-art CBT platform",
      features: [
        "Unlimited practice exams",
        "Timed test simulations",
        "Instant scoring and feedback",
        "Performance analytics",
      ],
      color: "text-primary",
    },
    {
      title: "Crash Programs",
      icon: Clock,
      description: "Intensive short-term programs for last-minute preparation",
      features: [
        "Focused exam preparation",
        "Key concepts and formulas",
        "High-yield topic coverage",
        "Exam tips and tricks",
      ],
      color: "text-secondary",
    },
    {
      title: "Study Groups",
      icon: Users,
      description: "Collaborative learning environments with peer support",
      features: [
        "Group discussions and problem-solving",
        "Shared resources and materials",
        "Peer teaching and learning",
        "Motivational support system",
      ],
      color: "text-accent",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-0">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
              <p className="text-lg opacity-90">
                Comprehensive educational solutions designed to help you achieve academic excellence
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardHeader>
                    <service.icon className={`h-12 w-12 ${service.color} mb-4`} />
                    <CardTitle className="text-2xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Our Services */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Services?</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-3">Experienced Educators</h3>
                    <p className="text-muted-foreground">
                      Learn from tutors with proven track records in helping students achieve 
                      top scores in JAMB, UTME, and university examinations.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-3">Flexible Learning Options</h3>
                    <p className="text-muted-foreground">
                      Choose from in-person classes, online sessions, or hybrid models that 
                      fit your schedule and learning preferences.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-3">Comprehensive Materials</h3>
                    <p className="text-muted-foreground">
                      Access extensive study materials, past questions, and practice tests 
                      designed to cover all exam topics thoroughly.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-3">Affordable Pricing</h3>
                    <p className="text-muted-foreground">
                      Quality education shouldn't break the bank. We offer competitive rates 
                      with flexible payment plans to suit your budget.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-r from-secondary to-primary text-primary-foreground">
              <CardContent className="pt-12 pb-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                  Join GeniusLab CBT today and take the first step towards academic success
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/contact">
                    <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                      Contact Us
                    </Button>
                  </Link>
                  <Link to="/exam">
                    <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10">
                      Try Free Exam
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <AdBannerSmart adSlot="6977766720" />
      <Footer />
    </div>
  );
};

export default Services;
