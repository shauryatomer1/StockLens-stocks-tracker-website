"use client";
import React from "react";
import { StockWithWatchlistStatus } from "@/lib/types";

interface SearchCommandProps {
  label: string;
  renderAs?: "text" | "button";
  initialStocks?: StockWithWatchlistStatus[];
}

const SearchCommand = ({ label, renderAs = "button" }: SearchCommandProps) => {
  if (renderAs === "text") {
    return (
      <button className="text-gray-300 hover:text-yellow-500 transition-colors">
        {label}
      </button>
    );
  }

  return (
    <button className="bg-yellow-500 text-black px-3 py-1 rounded">
      {label}
    </button>
  );
};

export default SearchCommand;
