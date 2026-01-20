export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "REGISTRATION" | "ACTIVE" | "COMPLETED";
}
