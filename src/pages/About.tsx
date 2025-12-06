import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, TrendingUp, BookOpen, Award } from "lucide-react";
import { ExpandableText } from "@/components/ExpandableText";
import holysinnerProfile from "@/assets/holysinner-profile.jpg";
import colossusProfile from "@/assets/colossus-profile.jpg";
import greenarrowProfile from "@/assets/greenarrow-profile.jpg";
import mathleteProfile from "@/assets/mathlete-profile.jpg";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About GeniusLab</h1>
              <p className="text-lg opacity-90">
                Where Learning Meets Excellence. Your Success, Our Mission.
              </p>
            </div>
          </div>
        </section>

        {/* Official Profile */}
        <section className="py-16 bg-gradient-to-br from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-lg">
                <CardContent className="pt-8">
                  <h2 className="text-3xl font-bold mb-6 text-center">GeniusLab Educational Consult — Official Profile</h2>
                  <ExpandableText text="GeniusLab Educational Consult is a leading academic support hub built on a single belief: every student can excel when learning is simplified, structured, and delivered with mastery. At GeniusLab, we transform fear into confidence, confusion into clarity, and average performance into outstanding results through a unique blend of expert tutoring, mentorship, and problem-solving techniques tailored for today's learners.

We are not just a tutorial center, we are an excellence factory." />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <Award className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold">Our Founder</h2>
              </div>
              
              <Card className="shadow-lg overflow-hidden">
                <CardContent className="pt-8">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-48 h-48 rounded-full overflow-hidden mb-4 shadow-xl border-4 border-primary/20">
                      <img 
                        src={holysinnerProfile} 
                        alt="Etim Nsisong Enefiok (Holysinner)"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-2">Etim Nsisong Enefiok (Holysinner)</h3>
                    <p className="text-sm text-muted-foreground font-medium">Founder & Lead Tutor</p>
                  </div>
                  
                  <ExpandableText text="Etim Nsisong Enefiok, widely known by his academic moniker 'Holysinner,' is a distinguished tutor and rising scholar from the Department of Mathematics, Federal University Oye-Ekiti (FUOYE). Born with an innate passion for teaching and intellectual exploration, he has grown into one of the most influential young educators within his academic community.

From his earliest years in elementary school, Etim discovered that teaching was more than something he could do — it was something he was called to do. What began as a simple desire to help his classmates gradually evolved into a deep-seated commitment to impact, mentorship, and excellence. Over the years, this same commitment to service and effective representation inspired him to step into leadership, where he stood out as a voice for student welfare. This conviction led him to contest for the position of Senator representing the Faculty of Physical Sciences in the Federal University Oye Ekiti Student Union Senate." />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Identity */}
        <section className="py-16 bg-gradient-to-br from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Identity</h2>
              </div>

              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <ExpandableText text="GeniusLab Educational Consult is powered by a team of exceptional tutors who combine deep academic expertise, proven teaching experience, and a passion for raising academically sound, emotionally confident, and mentally prepared students across FUOYE and Nigeria at large.

Our learning model goes beyond teaching; we create an environment where students understand why concepts work, not just how to memorize them. This is what sets us apart." />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Team of Experts */}
        <section className="py-16 bg-gradient-to-br from-secondary/5 to-accent/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Users className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">Our Team of Experts</h2>
                <p className="text-muted-foreground">
                  Meet the masterminds behind academic excellence
                </p>
              </div>

              <div className="space-y-8">
                {/* Colossus */}
                <Card className="shadow-lg overflow-hidden">
                  <CardContent className="pt-8">
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-48 h-48 rounded-full overflow-hidden mb-4 shadow-xl border-4 border-primary/20">
                        <img 
                          src={colossusProfile} 
                          alt="Colossus - Olonade Modiu Akorede"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-primary mb-1">COLOSSUS</h3>
                      <p className="text-lg font-semibold text-secondary mb-2">The Mathematics Maestro</p>
                      <p className="text-sm text-muted-foreground">Olonade Modiu Akorede</p>
                    </div>
                    
                    <ExpandableText text="Olonade Modiu Akorede (popularly known as Colossus) is a graduate of the Department of Mathematics, Federal University Oye-Ekiti (FUOYE). A seasoned tutor of Mathematics, Physics, and all mathematics-related courses, he brings over 6 years of continuous tutoring excellence, helping students dismantle their fear of Mathematics and achieve results they once thought were impossible.

His approach is practical, simplified, and deeply analytical, turning the hardest mathematical/physics concepts into understandable steps. His impact in the field is widely acknowledged, and for many students, Colossus is the difference between struggling and succeeding." />
                  </CardContent>
                </Card>

                {/* Green Arrow */}
                <Card className="shadow-lg overflow-hidden">
                  <CardContent className="pt-8">
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-48 h-48 rounded-full overflow-hidden mb-4 shadow-xl border-4 border-secondary/20">
                        <img 
                          src={greenarrowProfile} 
                          alt="Green Arrow - Aroyame Praise Okemeshimi"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-secondary mb-1">GREEN ARROW</h3>
                      <p className="text-lg font-semibold text-accent mb-2">The Chemistry Prodigy</p>
                      <p className="text-sm text-muted-foreground">Aroyame Praise Okemeshimi</p>
                    </div>
                    
                    <ExpandableText text="Aroyame Praise Okemeshimi, fondly called Green Arrow, is a 200-Level Medicine & Surgery student of FUOYE and one of the most outstanding young tutors in the sciences today.

With over 3 years of experience teaching Chemistry, Green Arrow has mentored students who scored 340+ in JAMB, excelled in WAEC, and maintained high GPAs in top universities nationwide. A scholar with a 5.0 GPA in 100 level, he embodies discipline, brilliance, and a passion for simplifying Chemistry in a way that makes students fall in love with it.

Green Arrow represents academic brilliance at its finest, the ideal model for every science student." />
                  </CardContent>
                </Card>

                {/* Mathlete (Joel) - Contributor */}
                <Card className="shadow-lg overflow-hidden">
                  <CardContent className="pt-8">
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-48 h-48 rounded-full overflow-hidden mb-4 shadow-xl border-4 border-accent/20">
                        <img 
                          src={mathleteProfile} 
                          alt="Mathlete - Oludipe Olamide Joel"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-accent mb-1">MATHLETE</h3>
                      <p className="text-lg font-semibold text-primary mb-2">Question Bank Contributor</p>
                      <p className="text-sm text-muted-foreground">Oludipe Olamide Joel</p>
                    </div>
                    
                    <ExpandableText text="Oludipe Olamide Joel, popularly known as Mathlete, is a 300-Level student of the Department of Mathematics at Federal University Oye-Ekiti and also the Pioneer Vice President for Faculty of Physical Sciences.

He once served as the PRO of Nigerian Mathematics Science Students FUOYE Chapter (NAMSSN) and is a vibrant student leader. As a passionate advocate for mathematics education, Joel has demonstrated exceptional leadership skills through his various roles.

Joel is a key contributor to the GeniusLab exam question bank, helping to provide quality practice materials for students preparing for their academic assessments." />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* The GeniusLab Advantage */}
        <section className="py-16 bg-gradient-to-br from-background to-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <TrendingUp className="h-16 w-16 text-secondary mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">The GeniusLab Advantage</h2>
                <p className="text-muted-foreground">What makes us different</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <BookOpen className="h-10 w-10 text-primary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Expert Tutors Only</h3>
                    <p className="text-muted-foreground">
                      Our tutors are not just knowledgeable, they are specialists with proven track records of results.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <Target className="h-10 w-10 text-secondary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Modern Teaching Methods</h3>
                    <p className="text-muted-foreground">
                      We combine real-life applications, visual learning, exam-focused drills, and interactive explanations to guarantee understanding.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <Users className="h-10 w-10 text-accent mb-3" />
                    <h3 className="text-xl font-bold mb-2">Personalized Academic Coaching</h3>
                    <p className="text-muted-foreground">
                      Every student receives tailored guidance to help them overcome their unique academic challenges.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <TrendingUp className="h-10 w-10 text-primary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Record-Breaking Results</h3>
                    <p className="text-muted-foreground">
                      From JAMB 300+ scorers to WAEC distinctions and high-performing university students, our results speak louder than words.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow md:col-span-2">
                  <CardContent className="pt-6">
                    <Award className="h-10 w-10 text-secondary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Mentorship Beyond the Classroom</h3>
                    <p className="text-muted-foreground">
                      We train students in discipline, confidence, critical thinking, exam strategy, and academic planning.
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
