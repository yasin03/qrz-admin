export interface BolumType {
  IDSube: number;
  IDSirket: number;
  IDBolum: number;

  BolumAdi: string;

  CreatedDate: string;
  IDKullanici: string;
}

// Route payload contract: ADD_BOLUM -> IDSube + BolumAdi
export interface CreateBolumRequest {
  IDSube: number;
  BolumAdi: string;
  IDKullanici?: string;
}

// Route payload contract: UPDATE_BOLUM -> IDBolum + IDSube + BolumAdi
export interface UpdateBolumRequest {
  IDBolum: number;
  IDSube: number;
  BolumAdi: string;
  IDKullanici?: string;
}

export interface DeleteBolumRequest {
  IDBolum: number;
  IDSube: number;
}
