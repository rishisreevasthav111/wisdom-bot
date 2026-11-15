import { queryOptions } from "@tanstack/react-query";
import { getCompanies, getCompany, getStats, getTips, getUnansweredQuestions } from "./api";
import type { TipFilters } from "./types";

export const tipsQuery = (filters: TipFilters = {}) =>
  queryOptions({ queryKey: ["tips", filters], queryFn: () => getTips(filters) });

export const statsQuery = () => queryOptions({ queryKey: ["stats"], queryFn: getStats });

export const companiesQuery = () => queryOptions({ queryKey: ["companies"], queryFn: getCompanies });

export const companyQuery = (slug: string) =>
  queryOptions({ queryKey: ["company", slug], queryFn: () => getCompany(slug) });

export const unansweredQuery = () =>
  queryOptions({ queryKey: ["unanswered"], queryFn: getUnansweredQuestions });
