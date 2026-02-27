import { useState } from "react";
import Header, { Tab } from "../Header";
import { ThemeProvider } from "../ThemeProvider";

export default function HeaderExample() {
  const [activeTab, setActiveTab] = useState<any>("dashboard");

  return (
    <ThemeProvider>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
    </ThemeProvider>
  );
}
