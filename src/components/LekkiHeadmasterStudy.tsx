import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronDown, ChevronUp, Star, Users, Lightbulb, HelpCircle, CheckCircle2, Lock } from "lucide-react";
import lekkiCover from "@/assets/lekki-headmaster-cover.png";

interface LekkiHeadmasterStudyProps {
  hasFullAccess?: boolean;
}

type Section = "summary" | "themes" | "characters" | "questions" | null;

const CHAPTERS = [
  {
    title: "Chapter 1 — Dusk",
    content: `The story opens at Stardom Schools in Lekki, Lagos during the morning assembly. The principal, Mr. Adebepo Adewale (Bepo), behaves unusually and suddenly breaks down in tears in front of students and teachers. Everyone is shocked because he is normally confident and lively.\n\nThe Vice-Principal Mrs. Grace Apeh quickly dismisses the students and escorts him to his office while the school nurse and other staff try to calm him down. The Managing Director Mrs. Ibidun Gloss is informed.\n\nBepo keeps repeating "Oluwa gba mi o" (God help me) but refuses to explain the cause of his distress. This chapter introduces the school environment and shows the pressure leaders face.`,
  },
  {
    title: "Chapter 2 — The Enticement",
    content: `After several days, Bepo finally explains the reason for his emotional breakdown: His wife Seri and their children have relocated to the United Kingdom, and they want him to join them.\n\nAlthough he loves his family, he also deeply loves his students and his career at Stardom Schools. He feels torn between family responsibility and loyalty to Nigeria and his students.\n\nHis colleagues discuss the attractive salaries and opportunities abroad, making the decision even more difficult.`,
  },
  {
    title: "Chapter 3 — Migration Tales",
    content: `This chapter focuses on stories about Nigerians who travelled abroad. Different people share experiences about migration:\n\n• Some succeed financially.\n• Others struggle with loneliness, discrimination, or low-status jobs.\n\nBepo realizes that life abroad is not always as easy as people imagine. The chapter highlights the popular Nigerian migration trend called "Japa."`,
  },
  {
    title: "Chapter 4 — A Case of Visa Denied",
    content: `A parent named Mrs. Ignatius contacts Bepo because her family's visa application is in trouble. A DNA test reveals that her husband is not the biological father of one of their children. This discovery creates a serious family crisis and stops their relocation plans.\n\nAnother school issue also appears: a student becomes frightened of a teacher because of his tribal marks, forcing management to reassign the teacher.\n\nThis chapter shows how personal and family issues affect migration plans and school life.`,
  },
  {
    title: "Chapter 5 — Snake in the Roof",
    content: `The Managing Director visits a piece of land owned by the school and discovers that teachers have turned it into a parking space filled with expensive cars.\n\nShe suspects corruption because teachers' salaries should not allow them to afford such vehicles. Investigation reveals that teachers bought the cars through loans from the school cooperative society, which holds about ₦95 million and has issued over ₦50 million in loans.\n\nThe management fears that teachers might use the money to start rival schools, so new rules are introduced:\n• Maximum loan of ₦250,000\n• MD approval for loans\n• Closer monitoring of the cooperative.`,
  },
  {
    title: "Chapter 6 — Comes vs Come",
    content: `During a Parents' Open Day, a parent complains about a grammar correction in class involving the expression "comes" vs "come."\n\nThe complaint almost leads to disciplinary action against the English teacher Mr. Fafore, but Bepo carefully resolves the issue.\n\nThe chapter exposes:\n• The stress teachers face\n• Parents' unrealistic expectations\n• The importance of professional respect in education.`,
  },
  {
    title: "Chapter 7 — Ritualists",
    content: `Bepo recalls a disturbing experience at his former school Beesway Group of Schools. He discovered suspicious ritual activities allegedly carried out by some staff members for financial success. During a confrontation, he was injured.\n\nThis experience influenced his decision to leave that school and strengthened his commitment to ethical leadership.\n\nThe chapter highlights corruption and moral decay in society.`,
  },
  {
    title: "Chapter 8 — Missions Unaccomplished",
    content: `Several unresolved issues arise in the school:\n• Rivalry between influential families affects student relationships.\n• A prefect election becomes controversial due to vote-buying.\n• Students' personal conflicts escalate during school events.\n\nBepo worries about leaving the school while many projects remain incomplete, including innovations from the school's Invention Club.`,
  },
  {
    title: "Chapter 9 — Laughing Waterfalls",
    content: `Bepo organizes educational excursions to different cultural and historical sites across Nigeria. Students visit places such as:\n• Badagry Slave Museum\n• Ikogosi Warm Springs\n• Erin-Ijesha Waterfalls\n• National Museum\n• Cultural festivals\n\nThrough these trips, students learn about Nigeria's history and heritage. Bepo reflects on the irony that Africans once fought against slavery but now voluntarily migrate abroad seeking opportunities.`,
  },
  {
    title: "Chapter 10 — Passport Pains",
    content: `Bepo tries to renew his passport but encounters Nigeria's bureaucratic challenges.\n\nProblems include:\n• Long queues\n• Corruption\n• Agents demanding extra fees\n\nHe eventually travels to Ibadan to complete the process with the help of an agent named Tai.\n\nThis chapter criticizes inefficiency in public institutions.`,
  },
  {
    title: "Chapter 11 — Point of No Return",
    content: `Stardom Schools organizes a grand farewell ceremony for Bepo.\n\nEvents include:\n• A football match between staff and students\n• Cultural dances and performances\n• Speeches praising his leadership\n\nThe Managing Director presents him with $10,000 in appreciation of his service.\n\nThe emotional ceremony shows how much the school community values him.`,
  },
  {
    title: "Chapter 12 — Dawn",
    content: `Bepo finally boards a plane to the UK. However, during the journey he reflects deeply on his life, his students, and his purpose.\n\nHe realizes that his true calling is teaching in Nigeria, not pursuing opportunities abroad.\n\nIn a surprising twist, he returns to Stardom Schools instead of migrating.\n\nThe students and staff celebrate his return, confirming his dedication to education and his country.`,
  },
];

const THEMES = [
  { name: "Migration (Japa Syndrome)", desc: "The pressure to relocate abroad for better opportunities and the consequences of that decision." },
  { name: "Leadership & Responsibility", desc: "Bepo's dedication to his school and students even when faced with personal dilemmas." },
  { name: "Integrity in Education", desc: "The importance of ethical leadership and honest practices in schools." },
  { name: "Corruption in Institutions", desc: "From cooperative society misuse to passport office bureaucracy and ritual practices." },
  { name: "Love for Country & Service", desc: "Choosing to serve one's community over personal gain abroad." },
  { name: "Family vs Duty", desc: "The painful conflict between family obligations and professional commitment." },
];

const CHARACTERS = [
  { name: "Mr. Adebepo Adewale (Bepo)", role: "Headmaster/Principal of Stardom Schools — the protagonist" },
  { name: "Mrs. Ibidun Gloss", role: "Managing Director of Stardom Schools" },
  { name: "Mrs. Grace Apeh", role: "Vice-Principal of the school" },
  { name: "Seri", role: "Bepo's wife who relocated to the UK" },
  { name: "Mr. Fafore", role: "English teacher involved in the grammar controversy" },
  { name: "Mrs. Ignatius", role: "Parent with a visa/DNA crisis" },
  { name: "Tai", role: "Passport agent in Ibadan" },
];

const QUESTIONS: { q: string; a: string }[] = [
  { q: "Who wrote The Lekki Headmaster?", a: "Kabir Alabi Garba." },
  { q: "The events in the novel mainly take place in which city?", a: "Lagos." },
  { q: "The school in the novel is located in which area of Lagos?", a: "Lekki." },
  { q: "What is the name of the school?", a: "Stardom Schools." },
  { q: "The novel mainly focuses on which profession?", a: "Teaching / Education." },
  { q: "Who is the protagonist of the novel?", a: "Mr. Adebepo Adewale." },
  { q: "What nickname is he called?", a: "Bepo." },
  { q: "What is Bepo's position in the school?", a: "Headmaster / Principal." },
  { q: "What kind of leader is Bepo?", a: "Dedicated and principled." },
  { q: "What emotional incident happened during the school assembly?", a: "Bepo broke down in tears." },
  { q: "Who is the Managing Director of Stardom Schools?", a: "Mrs. Ibidun Gloss." },
  { q: "Who is the Vice-Principal?", a: "Mrs. Grace Apeh." },
  { q: "What role does the school nurse play during Bepo's breakdown?", a: "She tries to calm him down." },
  { q: "What was the reaction of students during Bepo's breakdown?", a: "Shock and confusion." },
  { q: "What action did the Vice-Principal take immediately?", a: "She dismissed the assembly." },
  { q: "What is the name of Bepo's wife?", a: "Seri." },
  { q: "Where did Bepo's family relocate to?", a: "United Kingdom." },
  { q: "Why did they relocate?", a: "For better opportunities." },
  { q: "What dilemma does Bepo face?", a: "Whether to stay in Nigeria or join his family abroad." },
  { q: "What Nigerian slang word describes migration abroad?", a: "Japa." },
  { q: "What theme dominates the migration discussion?", a: "Opportunities and struggles abroad." },
  { q: "What does Bepo learn about life abroad?", a: "It is not always easy." },
  { q: "What emotional pressure does Bepo face?", a: "Family separation." },
  { q: "What internal conflict does he experience?", a: "Duty vs personal life." },
  { q: "What realization begins to form in his mind?", a: "That purpose is more important than money." },
  { q: "Which parent had a visa issue?", a: "Mrs. Ignatius." },
  { q: "What caused the visa problem?", a: "DNA test results." },
  { q: "What did the DNA test reveal?", a: "One child was not the husband's biological child." },
  { q: "What effect did the discovery have?", a: "It created a family crisis." },
  { q: "What broader theme does this event highlight?", a: "Hidden family secrets." },
  { q: "What suspicious discovery did the Managing Director make?", a: "Teachers had many expensive cars." },
  { q: "What was initially suspected?", a: "Financial corruption." },
  { q: "What was the real reason for the cars?", a: "Loans from the cooperative society." },
  { q: "How much money did the cooperative have?", a: "About ₦95 million." },
  { q: "What fear did management have about the loans?", a: "Teachers might start competing schools." },
  { q: "What event led to a language argument?", a: "Parents' Open Day." },
  { q: "Which teacher was involved?", a: "Mr. Fafore." },
  { q: "What grammar issue caused the conflict?", a: '"Comes" vs "Come".' },
  { q: "What role did Bepo play?", a: "Mediator." },
  { q: "What theme does this incident highlight?", a: "Teacher-parent tension." },
  { q: "Where did Bepo previously work?", a: "Beesway Group of Schools." },
  { q: "What shocking activity occurred there?", a: "Ritual practices." },
  { q: "What happened when Bepo confronted them?", a: "He was injured." },
  { q: "What effect did this have on him?", a: "He left the school." },
  { q: "What theme does this reveal?", a: "Moral corruption in society." },
  { q: "Which club promotes innovation in the school?", a: "The Invention Club." },
  { q: "What issue arose during prefect elections?", a: "Vote buying." },
  { q: "What does this show about students?", a: "Influence of societal corruption." },
  { q: "What does Bepo worry about before leaving?", a: "Unfinished school projects." },
  { q: "What does this show about his character?", a: "Responsibility." },
  { q: "What educational activity does Bepo organize?", a: "Excursions." },
  { q: "What historical place did students visit?", a: "Badagry Slave Museum." },
  { q: "What natural attraction did they visit?", a: "Ikogosi Warm Springs." },
  { q: "What is the purpose of the excursions?", a: "Experiential learning." },
  { q: "What lesson do students gain?", a: "Appreciation of Nigeria's culture." },
  { q: "What government service frustrates Bepo?", a: "Passport renewal." },
  { q: "What problems occur at the passport office?", a: "Long queues and corruption." },
  { q: "What solution does he find?", a: "Travel to Ibadan." },
  { q: "Who assists him there?", a: "Tai." },
  { q: "What theme does this chapter expose?", a: "Bureaucratic inefficiency." },
  { q: "Why is a farewell ceremony organized?", a: "Bepo is expected to relocate abroad." },
  { q: "What sports event takes place?", a: "Football match." },
  { q: "Who participates in the match?", a: "Teachers vs students." },
  { q: "What gift does Bepo receive?", a: "$10,000." },
  { q: "Who gives him the gift?", a: "Mrs. Ibidun Gloss." },
  { q: "What does Bepo initially do?", a: "Boards a plane to the UK." },
  { q: "What happens during the journey?", a: "Deep reflection." },
  { q: "What realization does he reach?", a: "His purpose is teaching in Nigeria." },
  { q: "What decision does he make?", a: "Returns home." },
  { q: "Where does he return to?", a: "Stardom Schools." },
  { q: "The strongest theme in the novel is?", a: "Migration." },
  { q: "Another major theme is?", a: "Leadership." },
  { q: "Which theme appears in passport renewal scenes?", a: "Corruption." },
  { q: "Which theme appears in the cooperative society episode?", a: "Financial management." },
  { q: "Which theme appears in the prefect election?", a: "Influence of societal corruption." },
  { q: "What does the novel teach about migration?", a: "It is not always the best solution." },
  { q: "What does Bepo's decision symbolize?", a: "Commitment to purpose." },
  { q: "What does the cooperative issue teach?", a: "Financial transparency." },
  { q: "What does the ritual incident warn against?", a: "Greed and immoral practices." },
  { q: "What does the novel say about leadership?", a: "Leaders must act with integrity." },
  { q: "Who is the emotional but dedicated headmaster?", a: "Bepo." },
  { q: "Who supervises the school's administration?", a: "Mrs. Ibidun Gloss." },
  { q: "Who assists Bepo as Vice-Principal?", a: "Mrs. Grace Apeh." },
  { q: "Who is the English teacher in the grammar controversy?", a: "Mr. Fafore." },
  { q: "Who is Bepo's wife abroad?", a: "Seri." },
  { q: "Why did Bepo cry during assembly?", a: "Because of emotional stress about migration." },
  { q: "What symbol does the passport office represent?", a: "Government inefficiency." },
  { q: "Why did Bepo visit Ibadan?", a: "To process his passport." },
  { q: "What emotional theme appears in the farewell ceremony?", a: "Appreciation." },
  { q: "What internal conflict defines Bepo's journey?", a: "Duty vs migration." },
  { q: "What is the main conflict of the novel?", a: "Migration vs commitment." },
  { q: "What does Stardom Schools represent?", a: "Educational excellence." },
  { q: "What does Bepo represent?", a: "Dedicated leadership." },
  { q: "What does the UK symbolize in the novel?", a: "Opportunity abroad." },
  { q: "What does Nigeria symbolize?", a: "Responsibility and service." },
  { q: "What makes Bepo return to Nigeria?", a: "Realization of his life's purpose." },
  { q: "What emotion dominates the farewell ceremony?", a: "Respect." },
  { q: "What quality defines Bepo most?", a: "Dedication." },
  { q: "What lesson should students learn from the novel?", a: "Serve society with integrity." },
  { q: "What is the central message of the novel?", a: "True fulfillment comes from purpose and service, not just migration." },
];

const LekkiHeadmasterStudy = ({ hasFullAccess = false }: LekkiHeadmasterStudyProps) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>(null);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  const [visibleQuestions, setVisibleQuestions] = useState(20);

  // Free users can see first 2 chapters, first 10 questions, themes preview, characters preview
  const FREE_CHAPTERS = 2;
  const FREE_QUESTIONS = 10;

  const toggleSection = (section: Section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const toggleAnswer = (idx: number) => {
    setShowAnswer((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <Card className="border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-950/30 dark:via-gray-900 dark:to-orange-950/20 shadow-xl overflow-hidden">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-green-700 via-green-600 to-emerald-700 p-4 md:p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30" />
        <div className="relative flex flex-col md:flex-row items-center gap-4">
          <div className="w-24 h-32 md:w-28 md:h-36 rounded-lg overflow-hidden shadow-2xl border-2 border-white/30 flex-shrink-0">
            <img src={lekkiCover} alt="The Lekki Headmaster by Kabir Alabi Garba" className="w-full h-full object-cover object-right" />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <Badge className="bg-amber-400 text-black font-bold text-xs hover:bg-amber-400">
                📖 JAMB 2025/2026 Novel
              </Badge>
              <Badge variant="outline" className="border-white/50 text-white text-xs">
                COMPULSORY
              </Badge>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              The Lekki Headmaster
            </h2>
            <p className="text-green-100 text-sm">by Kabir Alabi Garba</p>
            <p className="text-green-200 text-xs mt-1 max-w-lg">
              Complete chapter-by-chapter summary, themes, characters & 100 likely JAMB questions with answers. Everything you need to ace the Literature section!
            </p>
            <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-white/80 text-xs ml-1">Must-Read</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-3 md:p-5 space-y-3">
        {/* Section Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={activeSection === "summary" ? "default" : "outline"}
            onClick={() => toggleSection("summary")}
            className="gap-1.5 text-xs md:text-sm h-10"
          >
            <BookOpen className="h-4 w-4" />
            Chapter Summaries
          </Button>
          <Button
            variant={activeSection === "themes" ? "default" : "outline"}
            onClick={() => toggleSection("themes")}
            className="gap-1.5 text-xs md:text-sm h-10"
          >
            <Lightbulb className="h-4 w-4" />
            Themes & Lessons
          </Button>
          <Button
            variant={activeSection === "characters" ? "default" : "outline"}
            onClick={() => toggleSection("characters")}
            className="gap-1.5 text-xs md:text-sm h-10"
          >
            <Users className="h-4 w-4" />
            Characters
          </Button>
          <Button
            variant={activeSection === "questions" ? "default" : "outline"}
            onClick={() => toggleSection("questions")}
            className="gap-1.5 text-xs md:text-sm h-10"
          >
            <HelpCircle className="h-4 w-4" />
            100 Q&A
          </Button>
        </div>

        {/* Central Message */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p className="text-xs md:text-sm text-green-800 dark:text-green-200 font-medium text-center italic">
            ✅ <strong>Central Message:</strong> "True fulfillment comes from serving one's community and remaining committed to one's purpose, rather than blindly chasing opportunities abroad."
          </p>
        </div>

        {/* Chapter Summaries */}
        {activeSection === "summary" && (
          <ScrollArea className="h-[55vh]">
            <div className="space-y-2 pr-3">
              {CHAPTERS.map((ch, idx) => (
                <Card key={idx} className="border border-border">
                  <button
                    className="w-full flex items-center justify-between p-3 text-left"
                    onClick={() => setExpandedChapter(expandedChapter === idx ? null : idx)}
                  >
                    <span className="text-sm font-semibold text-foreground">{ch.title}</span>
                    {expandedChapter === idx ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {expandedChapter === idx && (
                    <CardContent className="pt-0 pb-3 px-3">
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{ch.content}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Themes */}
        {activeSection === "themes" && (
          <div className="space-y-2">
            {THEMES.map((t, idx) => (
              <div key={idx} className="flex gap-3 items-start bg-muted/50 rounded-lg p-3">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Characters */}
        {activeSection === "characters" && (
          <div className="space-y-2">
            {CHARACTERS.map((c, idx) => (
              <div key={idx} className="flex gap-3 items-start bg-muted/50 rounded-lg p-3">
                <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 100 Questions */}
        {activeSection === "questions" && (
          <ScrollArea className="h-[55vh]">
            <div className="space-y-2 pr-3">
              {QUESTIONS.slice(0, visibleQuestions).map((item, idx) => (
                <Card key={idx} className="border border-border">
                  <button
                    className="w-full flex items-start gap-2 p-3 text-left"
                    onClick={() => toggleAnswer(idx)}
                  >
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.q}</p>
                      {showAnswer[idx] && (
                        <div className="flex items-start gap-1.5 mt-2 bg-green-50 dark:bg-green-900/30 rounded-md p-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-green-700 dark:text-green-300 font-medium">{item.a}</p>
                        </div>
                      )}
                    </div>
                  </button>
                </Card>
              ))}
              {visibleQuestions < QUESTIONS.length && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setVisibleQuestions((v) => Math.min(v + 20, QUESTIONS.length))}
                >
                  Load More Questions ({QUESTIONS.length - visibleQuestions} remaining)
                </Button>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default LekkiHeadmasterStudy;
