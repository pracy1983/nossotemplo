import React, { useState, useRef, useEffect } from 'react';
import { Save, Edit3, Trash2, Mail, UserPlus, ArrowLeft, Upload, Crop, AlertTriangle, X, Eye, EyeOff } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Student } from '../../types';
import { generateId, validateCPF, validateEmail, formatCPF, formatPhone } from '../../utils/helpers';
import Modal from '../common/Modal';
import { toast } from 'react-toastify';

interface AddStudentProps {
  onNavigateToList?: () => void;
}

const AddStudent: React.FC<AddStudentProps> = ({ onNavigateToList }) => {
  const { addStudent, updateStudent, deleteStudent, students } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({
    fullName: '',
    birthDate: '',
    cpf: '',
    rg: '',
    email: '',
    phone: '',
    religion: '',
    unit: 'SP',
    // Address fields
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    zipCode: '',
    city: '',
    state: '',
    // Other fields
    developmentStartDate: '',
    internshipStartDate: '',
    magistInitiationDate: '',
    notEntryDate: '',
    masterMagusInitiationDate: '',
    isFounder: false,
    isActive: true,
    isAdmin: false,
    isGuest: false,
    attendance: []
  });
  const [photo, setPhoto] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [cropData, setCropData] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 267 // 3:4 ratio
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Update preview whenever crop data changes
  useEffect(() => {
    if (showCropModal && originalImage) {
      updatePreview();
    }
  }, [cropData, showCropModal, originalImage]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    } else {
      // Check for duplicate email (only for new students or when changing email)
      const existingStudent = students.find(s => 
        s.email.toLowerCase() === formData.email!.toLowerCase() && 
        s.id !== formData.id
      );
      if (existingStudent) {
        newErrors.email = 'Já existe um aluno com este email';
      }
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    }

    // Address validation
    if (formData.zipCode && !/^\d{5}-?\d{3}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'CEP inválido (formato: 00000-000)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      const studentData: Student = {
        id: formData.id || generateId(),
        photo,
        fullName: formData.fullName!,
        birthDate: formData.birthDate!,
        cpf: formData.cpf || '',
        rg: formData.rg || '',
        email: formData.email!,
        phone: formData.phone || '',
        religion: formData.religion || '',
        unit: formData.unit as 'SP' | 'BH',
        // Address fields
        street: formData.street || '',
        number: formData.number || '',
        complement: formData.complement || '',
        neighborhood: formData.neighborhood || '',
        zipCode: formData.zipCode || '',
        city: formData.city || '',
        state: formData.state || '',
        // Development dates
        developmentStartDate: formData.developmentStartDate || undefined,
        internshipStartDate: formData.internshipStartDate || undefined,
        magistInitiationDate: formData.magistInitiationDate || undefined,
        notEntryDate: formData.notEntryDate || undefined,
        masterMagusInitiationDate: formData.masterMagusInitiationDate || undefined,
        isFounder: formData.isFounder || false,
        isActive: formData.isActive ?? true,
        attendance: formData.attendance || [],
        isAdmin: formData.isAdmin || false,
        isGuest: formData.isGuest || false,
        role: formData.isAdmin ? 'admin' : 'student'
      };

      if (formData.id) {
        await updateStudent(formData.id, studentData);
        alert('Aluno atualizado com sucesso!');
      } else {
        await addStudent(studentData);
        alert('Aluno cadastrado com sucesso!');
        
        // Navigate to student list after successful creation
        if (onNavigateToList) {
          onNavigateToList();
          return;
        }
      }

      // Reset form only if not navigating away
      setFormData({
        fullName: '',
        birthDate: '',
        cpf: '',
        rg: '',
        email: '',
        phone: '',
        religion: '',
        unit: 'SP',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        zipCode: '',
        city: '',
        state: '',
        developmentStartDate: '',
        internshipStartDate: '',
        magistInitiationDate: '',
        notEntryDate: '',
        masterMagusInitiationDate: '',
        isFounder: false,
        isActive: true,
        isAdmin: false,
        isGuest: false,
        attendance: []
      });
      setPhoto('');
      setIsEditing(false);
      setErrors({});
    } catch (error: any) {
      console.error('Error saving student:', error);
      
      // Handle specific error messages
      if (error.message?.includes('Já existe um aluno com este email') ||
          error.message?.includes('duplicate key value violates unique constraint')) {
        setErrors({ email: 'Já existe um aluno com este email' });
        alert('Erro: Já existe um aluno cadastrado com este email. Use um email diferente.');
      } else {
        alert('Erro ao salvar aluno. Tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setOriginalImage(imageUrl);
        setPhoto(imageUrl);
        
        // Reset crop data for new image
        setCropData({
          x: 50,
          y: 50,
          width: 200,
          height: 267
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropImage = () => {
    if (!originalImage) return;
    setShowCropModal(true);
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { offsetWidth, offsetHeight } = imageRef.current;
      setImageSize({ width: offsetWidth, height: offsetHeight });
      
      // Center the crop area and ensure it fits within bounds
      const maxWidth = Math.min(200, offsetWidth - 20);
      const maxHeight = Math.min(267, offsetHeight - 20);
      const width = Math.min(maxWidth, maxHeight * 3 / 4);
      const height = width * 4 / 3;
      
      setCropData({
        x: (offsetWidth - width) / 2,
        y: (offsetHeight - height) / 2,
        width,
        height
      });
    }
  };

  const constrainCropData = (newCropData: typeof cropData) => {
    // Ensure crop area stays within image bounds
    const maxX = Math.max(0, imageSize.width - newCropData.width);
    const maxY = Math.max(0, imageSize.height - newCropData.height);
    
    return {
      ...newCropData,
      x: Math.max(0, Math.min(newCropData.x, maxX)),
      y: Math.max(0, Math.min(newCropData.y, maxY)),
      width: Math.min(newCropData.width, imageSize.width),
      height: Math.min(newCropData.height, imageSize.height)
    };
  };

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({ x: x - cropData.x, y: y - cropData.y });
    } else {
      setIsResizing(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const newX = x - dragStart.x;
      const newY = y - dragStart.y;
      
      const constrainedData = constrainCropData({
        ...cropData,
        x: newX,
        y: newY
      });
      
      setCropData(constrainedData);
    } else if (isResizing) {
      const newWidth = Math.max(50, x - cropData.x);
      const newHeight = Math.round(newWidth * 4 / 3); // Maintain 3:4 ratio
      
      const constrainedData = constrainCropData({
        ...cropData,
        width: newWidth,
        height: newHeight
      });
      
      setCropData(constrainedData);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const updatePreview = () => {
    if (!originalImage || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size for preview (150x200)
      canvas.width = 150;
      canvas.height = 200;

      // Calculate scale factors
      const scaleX = img.naturalWidth / imageSize.width;
      const scaleY = img.naturalHeight / imageSize.height;
      
      const sourceX = cropData.x * scaleX;
      const sourceY = cropData.y * scaleY;
      const sourceWidth = cropData.width * scaleX;
      const sourceHeight = cropData.height * scaleY;

      // Clear canvas
      ctx.clearRect(0, 0, 150, 200);

      // Draw the cropped image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        150,
        200
      );
    };
    
    img.src = originalImage;
  };

  const applyCrop = () => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to 3:4 ratio (300x400)
      canvas.width = 300;
      canvas.height = 400;

      // Calculate scale factors
      const scaleX = img.naturalWidth / imageSize.width;
      const scaleY = img.naturalHeight / imageSize.height;
      
      const sourceX = cropData.x * scaleX;
      const sourceY = cropData.y * scaleY;
      const sourceWidth = cropData.width * scaleX;
      const sourceHeight = cropData.height * scaleY;

      // Draw the cropped image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        300,
        400
      );

      // Convert canvas to data URL
      const croppedImage = canvas.toDataURL('image/jpeg', 0.8);
      setPhoto(croppedImage);
      setShowCropModal(false);
    };
    
    img.src = originalImage;
  };

  const handleDelete = async () => {
    if (formData.id && confirm('Tem certeza que deseja excluir este aluno?')) {
      try {
        await deleteStudent(formData.id);
        setFormData({
          fullName: '',
          birthDate: '',
          cpf: '',
          rg: '',
          email: '',
          phone: '',
          religion: '',
          unit: 'SP',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          zipCode: '',
          city: '',
          state: '',
          developmentStartDate: '',
          internshipStartDate: '',
          magistInitiationDate: '',
          notEntryDate: '',
          masterMagusInitiationDate: '',
          isFounder: false,
          isActive: true,
          isAdmin: false,
          isGuest: false,
          attendance: []
        });
        setPhoto('');
        setIsEditing(false);
        alert('Aluno excluído com sucesso!');
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Erro ao excluir aluno. Tente novamente.');
      }
    }
  };

  const handleResendPassword = async () => {
    if (formData.email && formData.fullName) {
      try {
        setIsLoading(true);
        
        // Gerar um token único para redefinição de senha
        // Normalmente isso seria feito no backend, mas para fins de demonstração
        // estamos gerando um token simples aqui
        const resetToken = Math.random().toString(36).substring(2, 15);
        const resetLink = `${window.location.origin}/redefinir-senha/${resetToken}`;
        
        // Importar a função de envio de email de redefinição de senha
        const { sendPasswordResetEmail } = await import('../../services/emailServiceFrontend');
        
        // Enviar email de redefinição de senha
        const success = await sendPasswordResetEmail(formData.email, resetLink, formData.fullName);
        
        if (success) {
          toast.success(`Email de redefinição de senha enviado para ${formData.email}`);
        } else {
          toast.error('Erro ao enviar email de redefinição de senha');
        }
      } catch (error) {
        console.error('Erro ao enviar email de redefinição de senha:', error);
        toast.error('Erro ao enviar email de redefinição de senha');
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.warning('É necessário informar o nome e email do aluno');
    }
  };

  const handleEmailChange = (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {formData.id ? 'Editar Membro' : 'Adicionar Membro'}
          </h1>
          <p className="text-gray-400">
            {formData.id ? 'Modifique as informações do membro' : 'Cadastre um novo membro no sistema'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={onNavigateToList}
            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo Section */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Foto do Membro</h2>
          
          <div className="flex items-start space-x-6">
            <div className="relative">
              <div className="w-32 h-40 bg-gray-800 rounded-lg overflow-hidden border-2 border-dashed border-gray-600">
                {photo ? (
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={!isEditing && formData.id}
              />
            </div>
            
            <div className="flex-1">
              <p className="text-gray-300 mb-2">
                Clique na área ao lado para fazer upload da foto
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Recomendado: Formato 3x4, tamanho máximo 5MB
              </p>
              
              {photo && (
                <button
                  type="button"
                  onClick={handleCropImage}
                  className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors bg-red-600/10 hover:bg-red-600/20 px-3 py-2 rounded-lg border border-red-600/20"
                >
                  <Crop className="w-4 h-4" />
                  <span>Editar e Cortar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-6">Dados Pessoais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.fullName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
              {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Nascimento *
              </label>
              <input
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
              {errors.birthDate && <p className="text-red-400 text-sm mt-1">{errors.birthDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CPF
              </label>
              <input
                type="text"
                value={formData.cpf || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                placeholder="000.000.000-00"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
              {errors.cpf && <p className="text-red-400 text-sm mt-1">{errors.cpf}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                RG
              </label>
              <input
                type="text"
                value={formData.rg || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, rg: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white focus:ring-1 transition-colors ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-700 focus:border-red-600 focus:ring-red-600'
                }`}
                disabled={!isEditing && formData.id}
              />
              {errors.email && (
                <div className="flex items-center space-x-2 mt-1">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-red-400 text-sm">{errors.email}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefone
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Religião
              </label>
              <input
                type="text"
                value={formData.religion || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, religion: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unidade
              </label>
              <select
                value={formData.unit || 'SP'}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as 'SP' | 'BH' }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              >
                <option value="SP">Templo SP</option>
                <option value="BH">Templo BH</option>
                <option value="CP">Templo CP</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isFounder || false}
                onChange={(e) => setFormData(prev => ({ ...prev, isFounder: e.target.checked }))}
                className="rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900"
                disabled={!isEditing && formData.id}
              />
              <span className="text-gray-300">Fundador</span>
            </label>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-6">Endereço</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CEP
              </label>
              <input
                type="text"
                value={formData.zipCode || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: formatZipCode(e.target.value) }))}
                placeholder="00000-000"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
              {errors.zipCode && <p className="text-red-400 text-sm mt-1">{errors.zipCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rua
              </label>
              <input
                type="text"
                value={formData.street || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número
              </label>
              <input
                type="text"
                value={formData.number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Complemento
              </label>
              <input
                type="text"
                value={formData.complement || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                placeholder="Apto, sala, etc."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bairro
              </label>
              <input
                type="text"
                value={formData.neighborhood || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={formData.state || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              >
                <option value="">Selecione o estado</option>
                <option value="SP">São Paulo</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="MG">Minas Gerais</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="PR">Paraná</option>
                <option value="SC">Santa Catarina</option>
                <option value="BA">Bahia</option>
                <option value="GO">Goiás</option>
                <option value="PE">Pernambuco</option>
                <option value="CE">Ceará</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spiritual Development Dates */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-6">Datas de Desenvolvimento Espiritual</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Início de Desenvolvimento
              </label>
              <input
                type="date"
                value={formData.developmentStartDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, developmentStartDate: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Início do Estágio
              </label>
              <input
                type="date"
                value={formData.internshipStartDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, internshipStartDate: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Iniciação como Magista
              </label>
              <input
                type="date"
                value={formData.magistInitiationDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, magistInitiationDate: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Entrada na N.O.T.
              </label>
              <input
                type="date"
                value={formData.notEntryDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notEntryDate: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Iniciação como Mestre Mago
              </label>
              <input
                type="date"
                value={formData.masterMagusInitiationDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, masterMagusInitiationDate: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                disabled={!isEditing && formData.id}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-4">
            {formData.id && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar</span>
              </button>
            )}

            {formData.id && (
              <button
                type="button"
                onClick={handleResendPassword}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Reenviar Senha</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {formData.id && isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            )}

            {(!formData.id || isEditing) && (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 px-6 py-2 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setFormData({
                  fullName: '',
                  birthDate: '',
                  cpf: '',
                  rg: '',
                  email: '',
                  phone: '',
                  religion: '',
                  unit: 'SP',
                  street: '',
                  number: '',
                  complement: '',
                  neighborhood: '',
                  zipCode: '',
                  city: '',
                  state: '',
                  developmentStartDate: '',
                  internshipStartDate: '',
                  magistInitiationDate: '',
                  notEntryDate: '',
                  masterMagusInitiationDate: '',
                  isFounder: false,
                  isActive: true,
                  isAdmin: false,
                  isGuest: false,
                  attendance: []
                });
                setPhoto('');
                setIsEditing(false);
                setErrors({});
              }}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Membro</span>
            </button>
          </div>
        </div>
      </form>

      {/* Simplified Photo Crop Modal */}
      <Modal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        title="Editar e Cortar Foto"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              Ajuste o retângulo para selecionar a área da foto (formato 3x4)
            </p>
          </div>

          {originalImage && (
            <div className="relative bg-gray-800 rounded-lg p-4 flex justify-center">
              <div 
                className="relative inline-block select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={originalImage}
                  alt="Original"
                  className="max-w-full max-h-96 object-contain"
                  style={{ maxWidth: '500px' }}
                  onLoad={handleImageLoad}
                  draggable={false}
                />
                
                {/* Crop overlay rectangle */}
                <div
                  className="absolute border-2 border-red-500 bg-red-500/20 cursor-move"
                  style={{
                    left: `${cropData.x}px`,
                    top: `${cropData.y}px`,
                    width: `${cropData.width}px`,
                    height: `${cropData.height}px`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'drag')}
                >
                  {/* Resize handle */}
                  <div 
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 cursor-se-resize border border-white"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, 'resize');
                    }}
                  />
                  
                  {/* Center indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Pré-visualização (300x400px):</p>
            <div className="inline-block bg-gray-800 p-2 rounded">
              <canvas
                ref={previewCanvasRef}
                width="150"
                height="200"
                className="border border-gray-600 rounded"
                style={{ width: '150px', height: '200px' }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCropModal(false)}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
            <button
              onClick={applyCrop}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </button>
          </div>
        </div>

        {/* Hidden canvas for final crop */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Modal>
    </div>
  );
};

export default AddStudent;