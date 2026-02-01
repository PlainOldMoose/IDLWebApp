export interface CreateSeasonRequest {
  name: string;
  startDate: string; // ISO date: "YYYY-MM-DD"
  endDate: string;
}
