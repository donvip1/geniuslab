import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Award, Target, GraduationCap, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import tutorialClass1 from "@/assets/tutorial-class-1.jpg";
import tutorialClass2 from "@/assets/tutorial-class-2.jpg";
import tutorialClass3 from "@/assets/tutorial-class-3.jpg";

const Index = () => {
  const teamMembers = [
    {
      name: "Colossus",
      role: "Lead Educational Consultant",
      description: "Expert in JAMB/UTME preparation with 10+ years experience",
      icon: GraduationCap,
    },
    {
      name: "Green Arrow",
      role: "University Tutorial Specialist",
      description: "Specialized in university-level mathematics and sciences",
      icon: Target,
    },
    {
      name: "Holysinner",
      role: "CBT Technology Director",
      description: "Pioneer in educational technology and exam systems",
      icon: Lightbulb,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <main className="flex-1 pt-16">
        <section className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-primary-foreground">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                Excellence in Education, Success in Exams
              </h1>
              <p className="text-lg md:text-xl mb-8 opacity-90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
                GeniusLab Educational Consult - Your trusted partner for JAMB/UTME preparation, 
                university tutorials, and comprehensive CBT practice
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                <Link to="/exam">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Start Practice Exam
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-white/20 text-white">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Educational Images Gallery */}
        <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Real Learning, Real Results</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See our students in action - from interactive tutorials to focused exam preparation
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all">
                <img 
                  src={tutorialClass1} 
                  alt="Nigerian students in tutorial class with teacher" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white font-semibold">Interactive Tutorial Sessions</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all">
                <img 
                  src={tutorialClass2} 
                  alt="Students taking computer-based test in modern CBT center" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white font-semibold">Modern CBT Practice Center</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all">
                <img 
                  src={tutorialClass3} 
                  alt="Students collaborating in group study session" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white font-semibold">Collaborative Learning Environment</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-8 w-8 text-primary" />
                    <h2 className="text-2xl font-bold">Our Mission</h2>
                  </div>
                  <p className="text-muted-foreground">
                    To empower students with quality education, innovative learning tools, and 
                    comprehensive exam preparation that transforms academic challenges into opportunities for excellence.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="h-8 w-8 text-secondary" />
                    <h2 className="text-2xl font-bold">Our Vision</h2>
                  </div>
                  <p className="text-muted-foreground">
                    To become Nigeria's leading educational consultancy, recognized for producing 
                    top-performing students who excel in JAMB/UTME and university examinations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Expert Team</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our dedicated professionals bring years of experience and passion for education
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {teamMembers.map((member, index) => (
                <Card key={index} className="hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="p-4 rounded-full bg-primary/10">
                        <member.icon className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                    <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose GeniusLab?</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <BookOpen className="h-12 w-12 text-secondary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Comprehensive CBT System</h3>
                  <p className="text-muted-foreground">
                    Practice with our advanced Computer-Based Test platform, featuring timed exams 
                    and instant feedback on your performance.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Users className="h-12 w-12 text-accent mb-4" />
                  <h3 className="text-xl font-bold mb-2">Expert Tutoring</h3>
                  <p className="text-muted-foreground">
                    Learn from experienced educators who understand the exam patterns and 
                    know exactly what it takes to succeed.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Award className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Proven Track Record</h3>
                  <p className="text-muted-foreground">
                    Join hundreds of successful students who have achieved their academic goals 
                    with GeniusLab's guidance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-secondary to-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Excel?</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Start your journey to academic success with GeniusLab Educational Consult today
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
