import { getAxisUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/api';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const user = await getAxisUser();
  const profile = await getUserProfile(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#F5F5F5]">Configuración</h1>
        <p className="text-sm text-[#71717A]">
          Cuéntale a AXIS quién eres para que pueda personalizar tu experiencia.
        </p>
      </div>

      <SettingsClient
        userId={user.id}
        initialProfile={profile}
        userEmail={user.email}
      />
    </div>
  );
}
