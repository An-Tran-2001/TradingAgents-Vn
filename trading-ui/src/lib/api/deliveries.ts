import { fetchClient } from "./client";

export interface Delivery {
  id: number;
  report_id: number;
  channel: string;
  recipient: string;
  trigger_source: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  ticker: string;
  content: string | null;
  report_name: string | null;
}

export async function getDeliveries(skip: number = 0, limit: number = 100): Promise<Delivery[]> {
  return fetchClient(`/agent_reports/deliveries/all?skip=${skip}&limit=${limit}`);
}

export async function resendDelivery(deliveryId: number): Promise<{ message: string }> {
  return fetchClient(`/agent_reports/deliveries/${deliveryId}/resend`, {
    method: "POST",
  });
}

export async function createDelivery(reportId: number, channel: string, recipient: string): Promise<Delivery> {
  return fetchClient(`/agent_reports/deliveries`, {
    method: "POST",
    body: JSON.stringify({
      report_id: reportId,
      channel,
      recipient
    })
  });
}
