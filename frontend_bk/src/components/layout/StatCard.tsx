import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: "default" | "success" | "danger" | "accent";
}

function StatCard({
  label,
  value,
  icon,
  trend,
  color = "default",
}: StatCardProps) {
  const colorClass = {
    default: "stat-card-default",
    success: "stat-card-success",
    danger: "stat-card-danger",
    accent: "stat-card-accent",
  }[color];

  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <p className="stat-card-label">{label}</p>
          <h3 className="stat-card-value">{value}</h3>
          {trend && (
            <p
              className={`stat-card-trend ${
                trend.isPositive ? "trend-up" : "trend-down"
              }`}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              {Math.abs(trend.value)} vs last season
            </p>
          )}
        </div>
        {icon && <div className="stat-card-icon">{icon}</div>}
      </div>
      <div className="stat-card-decoration" />
    </div>
  );
}

export default StatCard;
