import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    toast({
      title: "Message sent successfully!",
      description: "We'll get back to you as soon as possible.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-0">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
              <p className="text-lg opacity-90">
                We'd love to hear from you. Get in touch with us today!
              </p>
            </div>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Contact Information */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Email</h3>
                        <p className="text-sm text-muted-foreground">Geniuslabeducational@gmail.com</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 rounded-full bg-secondary/10">
                        <Phone className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Phone</h3>
                        <p className="text-sm text-muted-foreground">+2348124269495</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 rounded-full bg-accent/10">
                        <MapPin className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Address</h3>
                        <p className="text-sm text-muted-foreground">
                          Federal University Oye Ekiti<br />
                          Ekiti State, Nigeria
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Office Hours</h3>
                        <p className="text-sm text-muted-foreground">
                          Monday - Friday: 9:00 AM - 6:00 PM<br />
                          Saturday: 10:00 AM - 4:00 PM<br />
                          Sunday: Closed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Enter your name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="What is this regarding?"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Tell us more about your inquiry..."
                          className="min-h-[150px]"
                          value={formData.message}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <Button type="submit" size="lg" className="w-full md:w-auto">
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card className="mt-6">
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-lg mb-3">Frequently Asked Questions</h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">When do classes start?</p>
                        <p className="text-muted-foreground">
                          We have rolling admissions and classes start every month. Contact us for the next intake.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Do you offer online classes?</p>
                        <p className="text-muted-foreground">
                          Yes! We offer both in-person and online classes to accommodate different learning preferences.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">What is your refund policy?</p>
                        <p className="text-muted-foreground">
                          We offer a satisfaction guarantee. Contact us within 14 days if you're not satisfied with our services.
                        </p>
                      </div>
                    </div>
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

export default Contact;
