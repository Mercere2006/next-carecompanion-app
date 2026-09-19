"use client";

import { useState, useMemo } from "react";
import { CompanionCardData } from "@/types/database";

export function useCompanionFilter(companions: CompanionCardData[]) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchArea, setSearchArea] = useState<string>("");
  const [maxRate, setMaxRate] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [specialNeedFilter, setSpecialNeedFilter] = useState<string>("");

  const hasActiveFilters = Boolean(
    selectedCategory ||
      searchArea ||
      specialNeedFilter ||
      searchKeyword ||
      maxRate,
  );

  const resetFilters = () => {
    setSelectedCategory("");
    setSearchArea("");
    setSpecialNeedFilter("");
    setSearchKeyword("");
    setMaxRate("");
  };

  const filteredCompanions = useMemo(() => {
    return companions.filter((comp) => {
      const nameMatch = comp.profile?.full_name
        ?.toLowerCase()
        .includes(searchKeyword.toLowerCase());
      const bioMatch = comp.bio
        ?.toLowerCase()
        .includes(searchKeyword.toLowerCase());
      const skillMatch = comp.skills?.some((s) =>
        s.toLowerCase().includes(searchKeyword.toLowerCase()),
      );
      const keywordMatch =
        !searchKeyword || nameMatch || bioMatch || skillMatch;

      const areaMatch =
        !searchArea || comp.service_areas?.some((a) => a.includes(searchArea));
      const rateMatch = !maxRate || comp.hourly_rate <= Number(maxRate);

      // Smart category matching (supports preset selection & freeform text)
      const categoryMatch =
        !selectedCategory.trim() ||
        (() => {
          const cat = selectedCategory.trim().toLowerCase();
          if (
            !cat ||
            cat === "เลือกทุกประเภทธุระ" ||
            cat === "ธุระทั่วไป"
          )
            return true;
          if (
            cat.includes("แพทย์") ||
            cat.includes("โรงพยาบาล") ||
            cat.includes("รพ.")
          ) {
            return (
              comp.bio?.includes("พยาบาล") ||
              comp.bio?.includes("รพ.") ||
              comp.bio?.includes("แพทย์") ||
              comp.skills?.some(
                (s) =>
                  s.includes("รพ.") ||
                  s.includes("แพทย์") ||
                  s.includes("สุขภาพ"),
              )
            );
          }
          if (cat.includes("ธนาคาร") || cat.includes("การเงิน")) {
            return (
              comp.bio?.includes("ธนาคาร") ||
              comp.skills?.some((s) => s.includes("ธนาคาร"))
            );
          }
          if (cat.includes("ราชการ")) {
            return (
              comp.bio?.includes("ราชการ") ||
              comp.skills?.some((s) => s.includes("ราชการ"))
            );
          }
          if (
            cat.includes("ซื้อ") ||
            cat.includes("ตลาด") ||
            cat.includes("ช้อป")
          ) {
            return (
              comp.bio?.includes("ซื้อ") ||
              comp.bio?.includes("ตลาด") ||
              comp.skills?.some(
                (s) => s.includes("ช้อป") || s.includes("สัมภาระ"),
              )
            );
          }
          // If custom text was typed
          const matchesCustom =
            comp.bio?.toLowerCase().includes(cat) ||
            comp.skills?.some((s) => s.toLowerCase().includes(cat));
          const anyOneMatches = companions.some(
            (c) =>
              c.bio?.toLowerCase().includes(cat) ||
              c.skills?.some((s) => s.toLowerCase().includes(cat)),
          );
          return anyOneMatches ? matchesCustom : true;
        })();

      // Smart special need matching (supports preset selection & freeform text)
      const needMatch =
        !specialNeedFilter.trim() ||
        (() => {
          const need = specialNeedFilter.trim().toLowerCase();
          if (
            !need ||
            need === "ความช่วยเหลือทั่วไป" ||
            need.includes("ไม่ระบุ")
          )
            return true;
          if (need.includes("พยุง"))
            return (
              comp.skills?.some((s) => s.includes("พยุง")) ||
              comp.bio?.includes("พยุง")
            );
          if (need.includes("วีลแชร์") || need.includes("รถเข็น"))
            return (
              comp.skills?.some((s) => s.includes("วีลแชร์")) ||
              comp.bio?.includes("วีลแชร์")
            );
          if (
            need.includes("รถยนต์") ||
            need.includes("ขับรถ") ||
            need.includes("คาร์")
          )
            return (
              comp.skills?.some((s) => s.includes("รถยนต์")) ||
              comp.bio?.includes("รถยนต์")
            );
          if (need.includes("อังกฤษ") || need.includes("english"))
            return (
              comp.skills?.some((s) => s.includes("อังกฤษ")) ||
              comp.bio?.includes("อังกฤษ")
            );
          // If custom text was typed
          const matchesCustom =
            comp.skills?.some((s) => s.toLowerCase().includes(need)) ||
            comp.bio?.toLowerCase().includes(need);
          const anyOneMatches = companions.some(
            (c) =>
              c.skills?.some((s) => s.toLowerCase().includes(need)) ||
              c.bio?.toLowerCase().includes(need),
          );
          return anyOneMatches ? matchesCustom : true;
        })();

      return (
        keywordMatch && areaMatch && rateMatch && categoryMatch && needMatch
      );
    });
  }, [
    companions,
    searchKeyword,
    searchArea,
    maxRate,
    selectedCategory,
    specialNeedFilter,
  ]);

  return {
    selectedCategory,
    setSelectedCategory,
    searchArea,
    setSearchArea,
    maxRate,
    setMaxRate,
    searchKeyword,
    setSearchKeyword,
    specialNeedFilter,
    setSpecialNeedFilter,
    filteredCompanions,
    hasActiveFilters,
    resetFilters,
  };
}
