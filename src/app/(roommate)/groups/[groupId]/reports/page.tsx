"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function GroupReportsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const csvUrl = `/api/roommate/groups/${groupId}/reports?${qs.toString()}`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">{t("roommate.page.reports")}</h2>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">{t("common.from")}</Label>
              <Input id="fromDate" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">{t("common.to")}</Label>
              <Input id="toDate" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          <Button asChild>
            <a href={csvUrl} download>
              <Download className="h-4 w-4" />
              {t("roommate.page.downloadCsv")}
            </a>
          </Button>

          <p className="text-xs text-slate-500">{t("roommate.page.downloadCsv")} — {t("common.date")} {t("common.optional")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
