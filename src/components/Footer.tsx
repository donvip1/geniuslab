import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Globe, MessageCircle } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-20 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">GeniusLab Educational Consult</h3>
            <p className="text-sm opacity-90">
              Empowering students with quality education and comprehensive CBT practice for academic excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/about" className="hover:underline">About Us</Link></li>
              <li><Link to="/services" className="hover:underline">Services</Link></li>
              <li><Link to="/exam" className="hover:underline">Take Exam</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <span>Geniuslabeducational@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <span>+2348124269495</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Federal University Oye Ekiti, Nigeria</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-bold text-lg mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/share/1AZsQNp3Nr/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Facebook size={24} />
              </a>
              <a href="https://whatsapp.com/channel/0029Vb6kqDVISTkQR9ZxN73x" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <MessageCircle size={24} />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Instagram size={24} />
              </a>
              <a href="https://geniuslabz.xyz/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Globe size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} GeniusLab Educational Consult. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
