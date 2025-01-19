import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { supabase } from '../services/supabase';
import { toast } from 'react-toastify';

interface PhotoUploadProps {
  onPhotoChange: (url: string) => void;
  currentPhotoUrl?: string;
}

export function PhotoUpload({ onPhotoChange, currentPhotoUrl }: PhotoUploadProps) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentPhotoUrl || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 300,
    height: 400,
    x: 0,
    y: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Proporção 3x4 fixa
  const aspect = 3 / 4;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    
    if (!session) {
      toast.error('Faça login para fazer upload de fotos');
      navigate('/login');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      toast.error('Faça login para fazer upload de fotos');
      navigate('/login');
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = 300;
    canvas.height = 400;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const uploadToSupabase = async (blob: Blob) => {
    try {
      if (!isAuthenticated) {
        toast.error('Faça login para fazer upload de fotos');
        navigate('/login');
        return;
      }

      const fileName = `photo-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      console.log('Iniciando upload do arquivo:', fileName);
      
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Erro detalhado do upload:', {
          message: error.message,
          status: error.status,
          statusCode: error.statusCode,
          details: error.details
        });
        throw error;
      }

      console.log('Upload concluído com sucesso:', data);

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      console.log('URL pública gerada:', urlData.publicUrl);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Erro completo:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        details: error.details,
        status: error.status
      });
      
      const errorMessage = error.message || 'Erro desconhecido ao fazer upload da foto';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para fazer upload de fotos');
      navigate('/login');
      return;
    }

    if (!imgRef.current || !crop) {
      toast.error('Por favor, selecione uma área da imagem');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Iniciando processo de crop e upload...');
      const croppedImage = await getCroppedImg(imgRef.current, crop as PixelCrop);
      console.log('Imagem cortada com sucesso');
      
      const photoUrl = await uploadToSupabase(croppedImage);
      onPhotoChange(photoUrl);
      toast.success('Foto atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao processar imagem:', error);
      toast.error(`Erro ao salvar foto: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center justify-center w-32 h-32 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-center text-gray-400">
              <span className="block text-3xl mb-2">+</span>
              <span className="text-sm">Adicionar Foto</span>
            </div>
          )}
        </label>
        {currentPhotoUrl && !previewUrl && (
          <img
            src={currentPhotoUrl}
            alt="Foto atual"
            className="w-32 h-32 object-cover rounded-lg"
          />
        )}
      </div>

      {previewUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">
            Ajuste a área da foto para o tamanho 3x4
          </p>
          <div className="max-w-xl bg-gray-800 p-4 rounded-lg">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={aspect}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Crop preview"
                className="max-w-full"
              />
            </ReactCrop>
          </div>
          <div className="mt-4 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setPreviewUrl('');
                setSelectedFile(null);
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar Foto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
