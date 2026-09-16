"use client";

import { BookingProvider } from "@/hooks/use-booking";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function BookLayout({ children }) {
  return (
    <BookingProvider>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-4xl">
          {children}
        </div>
      </main>
      <Footer />
    </BookingProvider>
  );
}
