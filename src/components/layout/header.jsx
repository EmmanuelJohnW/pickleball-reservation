"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu, CircleDot, Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { trackReservation } from "@/actions/reservations";
import { formatCurrency, formatDate, formatTimeRange, getStatusColor } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Book a Court" },
  { href: "/manage", label: "Manage Reservation" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [trackResult, setTrackResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;

    setSearching(true);
    setTrackResult(null);
    setNotFound(false);
    setShowDropdown(true);

    try {
      const result = await trackReservation(trimmed);
      if (result) {
        setTrackResult(result);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    setTrackResult(null);
    setNotFound(false);
    setShowDropdown(false);
  };

  const searchDropdown = (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-[340px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
    >
      {searching ? (
        <div className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Looking up reservation...</p>
        </div>
      ) : trackResult ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Reservation Status</p>
            <button onClick={clearSearch} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="font-mono text-sm font-bold text-green-700 mb-3">
            {trackResult.reservation_number}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(trackResult.status)}`}>
                {trackResult.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Court</span>
              <span className="font-medium text-gray-900">{trackResult.court_name} <span className="text-gray-400 capitalize text-xs">({trackResult.court_type})</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">{formatDate(trackResult.reservation_date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Time</span>
              <span className="font-medium text-gray-900">{formatTimeRange(trackResult.start_time, trackResult.end_time)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-green-700">{formatCurrency(trackResult.total_amount)}</span>
            </div>
          </div>
          </div>
        ) : notFound ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Not Found</p>
            <button onClick={clearSearch} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            No reservation found for <span className="font-mono font-bold">{searchValue}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Please check your reservation number and try again.</p>
        </div>
      ) : null}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-green-700">
          <CircleDot className="h-7 w-7 text-green-600" />
          <span>Court ni Wardo</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Desktop search */}
          <div className="relative">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                placeholder="Track reservation..."
                className="pl-9 pr-8 w-56 lg:w-64 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => {
                  if (trackResult || notFound) setShowDropdown(true);
                }}
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
            {showDropdown && searchDropdown}
          </div>

          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            Book a Court
          </Link>
        </nav>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <div className="flex flex-col gap-6 mt-8">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-xl text-green-700"
                onClick={() => setOpen(false)}
              >
                <CircleDot className="h-7 w-7 text-green-600" />
                <span>Court ni Wardo</span>
              </Link>

              {/* Mobile search */}
              <form onSubmit={(e) => { handleSearch(e); }} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Track reservation..."
                  className="pl-9 pr-8 text-sm"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>

              {/* Mobile search results */}
              {showDropdown && (trackResult || notFound) && (
                <div className="rounded-xl border border-gray-200 p-4">
                  {searching ? (
                    <div className="text-center py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-green-600 mx-auto" />
                    </div>
                  ) : trackResult ? (
                    <div className="space-y-2 text-sm">
                      <p className="font-mono text-xs font-bold text-green-700">{trackResult.reservation_number}</p>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(trackResult.status)}`}>
                          {trackResult.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Court</span>
                        <span className="font-medium">{trackResult.court_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date</span>
                        <span className="font-medium">{formatDate(trackResult.reservation_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time</span>
                        <span className="font-medium">{formatTimeRange(trackResult.start_time, trackResult.end_time)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-bold text-green-700">{formatCurrency(trackResult.total_amount)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No reservation found for <span className="font-mono font-bold">{searchValue}</span></p>
                  )}
                </div>
              )}

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base font-medium text-gray-600 hover:text-green-700 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/book"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors w-full"
              >
                Book a Court
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
