export interface SosSignal {
  id: number;
  sender_user: {
    id: number;
    email: string;
  };
  service: number | null;
  service_point: number | null;
  service_name: string | null;
  service_point_name: string | null;
  latitude: number;
  longitude: number;
  status: "inactive" | "active" | "pending";
  created_at: string;
}

export interface AlertSignal {
  id: number;
  sender_user: {
    id: number;
    email: string;
  };
  latitude: number;
  longitude: number;
  status: "inactive" | "active" | "pending";
  created_at: string;
}

export interface AlertSignalAnswer {
  id: number;
  alert_signal_id: number;
  responder_user: {
    id: number;
    email: string;
  };
  created_at: string;
}

export interface CreateSosSignalBody {
  latitude: number;
  longitude: number;
  service_id?: number | null;
  service_point_id?: number | null;
}

export interface CreateAlertSignalBody {
  latitude: number;
  longitude: number;
}

export interface CreateAlertSignalAnswerBody {
  alert_signal_id: number;
}
