import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, TrendingUp, BookOpen } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About GeniusLab</h1>
              <p className="text-lg opacity-90">
                Transforming education through innovation, expertise, and dedication
              </p>
            </div>
          </div>
        </section>

        {/* Our Identity */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Identity</h2>
                <p className="text-muted-foreground text-lg">
                  GeniusLab Educational Consult is a premier educational institution dedicated to 
                  empowering students through quality tutoring, innovative CBT systems, and 
                  comprehensive exam preparation services.
                </p>
              </div>

              <Card className="mb-8">
                <CardContent className="pt-6">
                  <p className="text-lg leading-relaxed">
                    Founded on the principles of educational excellence and student success, we combine 
                    traditional teaching methods with cutting-edge technology to create an unparalleled 
                    learning experience. Our focus spans JAMB/UTME preparation, university-level tutorials, 
                    and private tutoring services, ensuring students at every level receive the support they need.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Team of Experts */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Users className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">Our Team of Experts</h2>
                <p className="text-muted-foreground">
                  Led by three distinguished educators with complementary expertise
                </p>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-2xl font-bold mb-2 text-primary">Colossus</h3>
                    <p className="text-sm text-muted-foreground font-medium mb-3">Lead Educational Consultant</p>
                    <p className="leading-relaxed">
                      With over a decade of experience in JAMB/UTME preparation, Colossus has guided 
                      thousands of students to achieve outstanding results. His deep understanding of 
                      exam patterns and effective teaching methods has made him a cornerstone of our success.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-2xl font-bold mb-2 text-secondary">Green Arrow</h3>
                    <p className="text-sm text-muted-foreground font-medium mb-3">University Tutorial Specialist</p>
                    <p className="leading-relaxed">
                      Specializing in advanced mathematics and sciences, Green Arrow brings university-level 
                      expertise to our tutorials. His ability to simplify complex concepts has helped countless 
                      students excel in their university examinations.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-2xl font-bold mb-2 text-accent">Holysinner</h3>
                    <p className="text-sm text-muted-foreground font-medium mb-3">CBT Technology Director</p>
                    <p className="leading-relaxed">
                      A pioneer in educational technology, Holysinner designed and implemented our 
                      state-of-the-art CBT system. His vision has made practice exams more accessible 
                      and effective for students preparing for standardized tests.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* The GeniusLab Advantage */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <TrendingUp className="h-16 w-16 text-secondary mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">The GeniusLab Advantage</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <BookOpen className="h-10 w-10 text-primary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Comprehensive Curriculum</h3>
                    <p className="text-muted-foreground">
                      Our carefully designed programs cover all aspects of exam preparation, from 
                      foundational concepts to advanced problem-solving techniques.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <Target className="h-10 w-10 text-secondary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Personalized Approach</h3>
                    <p className="text-muted-foreground">
                      We understand that every student learns differently. Our tutors adapt their 
                      teaching methods to match individual learning styles and pace.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <Users className="h-10 w-10 text-accent mb-3" />
                    <h3 className="text-xl font-bold mb-2">Small Class Sizes</h3>
                    <p className="text-muted-foreground">
                      We maintain intimate class sizes to ensure every student receives adequate 
                      attention and support from our expert tutors.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <TrendingUp className="h-10 w-10 text-primary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Proven Results</h3>
                    <p className="text-muted-foreground">
                      Our students consistently achieve high scores in JAMB/UTME and university 
                      exams, with many gaining admission to top universities.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
