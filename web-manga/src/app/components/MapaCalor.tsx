'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';


interface SessaoMap {
  id: string;
  lote: string;
  planta: number;
  latitude: number;
  longitude: number;
  relatorios: any[];
}

export default function MapaCalor({ dados }: { dados: any[] }) {
  const pontosComGps = dados.filter((d: any) => d.latitude && d.longitude);
  
  if (pontosComGps.length === 0) {
    return (
      <div className="h-100 w-full bg-gray-200 flex items-center justify-center border-2 border-black rounded-lg">
        <p className="text-black font-bold">Sem dados de GPS para gerar o mapa.</p>
      </div>
    );
  }

  const latMedia = pontosComGps.reduce((acc: number, curr: any) => acc + curr.latitude, 0) / pontosComGps.length;
  const lngMedia = pontosComGps.reduce((acc: number, curr: any) => acc + curr.longitude, 0) / pontosComGps.length;

  return (
    <div className="h-100 w-full rounded-lg overflow-hidden border-2 border-black shadow-lg relative z-0">
      <MapContainer 
        center={[latMedia, lngMedia]} 
        zoom={17}
        maxZoom={17}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='Tiles &copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {pontosComGps.map((sessao: any) => {
          const temProblemaGrave = sessao.relatorios?.some((r: any) => r.porcentagem > 5);
          const temProblemaLeve = sessao.relatorios?.some((r: any) => r.porcentagem > 0 && r.porcentagem <= 5);
          
          let cor = '#22c55e'; // Verde
          if (temProblemaGrave) cor = '#ef4444'; // Vermelho
          else if (temProblemaLeve) cor = '#eab308'; // Amarelo

          return (
            <CircleMarker 
              key={sessao.id}
              center={[sessao.latitude, sessao.longitude]}
              pathOptions={{ color: 'black', weight: 1, fillColor: cor, fillOpacity: 0.8 }}
              radius={8}
            >
              <Popup>
                <div className="text-black">
                  <strong className="block text-sm">Planta {sessao.planta}</strong>
                  <span className="text-xs">Lote {sessao.lote}</span>
                  <hr className="my-1 border-gray-300"/>
                  {sessao.relatorios?.length > 0 ? (
                     sessao.relatorios.map((r: any, idx: number) => (
                       <div key={idx} className="text-xs">
                         {r.doencaOuPraga}: <strong>{r.porcentagem.toFixed(1)}%</strong>
                       </div>
                     ))
                  ) : (
                    <span className="text-xs text-green-600 font-bold">Saudável</span>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-4 right-4 bg-white p-2 rounded border border-black z-1000 text-xs font-bold text-black">
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-red-500 border border-black"></div> Crítico ({'>'}5%)</div>
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-yellow-500 border border-black"></div> Presença ({'<'}5%)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 border border-black"></div> Saudável</div>
      </div>
    </div>
  );
}