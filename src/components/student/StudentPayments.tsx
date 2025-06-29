import React, { useState } from 'react';
import { CreditCard, Calendar, CheckCircle, AlertCircle, QrCode, Copy } from 'lucide-react';
import { Student } from '../../types';
import { formatDate } from '../../utils/helpers';

interface StudentPaymentsProps {
  student: Student;
}

const StudentPayments: React.FC<StudentPaymentsProps> = ({ student }) => {
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  // Mock PIX data - in a real app this would come from a payment provider
  const pixData = {
    code: '00020126580014BR.GOV.BCB.PIX013636c4b8c4-4c4c-4c4c-4c4c-4c4c4c4c4c4c5204000053039865802BR5925NOSSO TEMPLO LTDA6009SAO PAULO62070503***6304ABCD',
    amount: 150.00,
    recipient: 'Nosso Templo',
    description: `Mensalidade ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
  };

  // Get payment history from monthly attendance records
  const getPaymentHistory = () => {
    return student.attendance
      .filter(att => att.type === 'monthly')
      .map(att => ({
        date: att.date,
        amount: 150.00, // Mock amount
        status: 'paid',
        method: 'PIX'
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Check if current month is paid
  const getCurrentMonthStatus = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthlyAttendance = student.attendance.find(att => 
      att.type === 'monthly' && att.date.startsWith(currentMonth)
    );
    return !!monthlyAttendance;
  };

  const paymentHistory = getPaymentHistory();
  const isCurrentMonthPaid = getCurrentMonthStatus();

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixData.code);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const generatePixQR = () => {
    // In a real app, you would generate a proper QR code
    // For demo purposes, we'll show a placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIj5RUiBDb2RlIFBJWDwvdGV4dD4KPC9zdmc+';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Pagamentos</h2>
        <p className="text-gray-400">Gerencie suas mensalidades e histórico de pagamentos</p>
      </div>

      {/* Current Month Status */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Mensalidade de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center space-x-2">
              {isCurrentMonthPaid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Pago</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">Pendente</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-white">R$ {pixData.amount.toFixed(2)}</p>
            {!isCurrentMonthPaid && (
              <button
                onClick={() => setShowPixModal(true)}
                className="mt-2 flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Gerar PIX</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Pagamentos Realizados</h3>
          </div>
          <p className="text-3xl font-bold text-green-400">{paymentHistory.length}</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-3 mb-2">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Total Pago</h3>
          </div>
          <p className="text-3xl font-bold text-blue-400">
            R$ {(paymentHistory.length * pixData.amount).toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Último Pagamento</h3>
          </div>
          <p className="text-lg font-bold text-purple-400">
            {paymentHistory.length > 0 
              ? formatDate(paymentHistory[0].date)
              : 'Nenhum pagamento'
            }
          </p>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-6">Histórico de Pagamentos</h3>
        
        {paymentHistory.length > 0 ? (
          <div className="space-y-3">
            {paymentHistory.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-600/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white">
                      Mensalidade - {new Date(payment.date).toLocaleDateString('pt-BR', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Pago em {formatDate(payment.date)}</span>
                      <span>•</span>
                      <span>{payment.method}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    R$ {payment.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-400">Confirmado</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhum pagamento realizado
            </h3>
            <p className="text-gray-500">
              Seus pagamentos aparecerão aqui após serem processados
            </p>
          </div>
        )}
      </div>

      {/* PIX Modal */}
      {showPixModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-75" onClick={() => setShowPixModal(false)} />

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-900 shadow-xl rounded-2xl border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">Pagamento via PIX</h3>
                <button
                  onClick={() => setShowPixModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Payment Details */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Detalhes do Pagamento</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Descrição:</span>
                      <span className="text-white">{pixData.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Valor:</span>
                      <span className="text-white font-semibold">R$ {pixData.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Beneficiário:</span>
                      <span className="text-white">{pixData.recipient}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    <img
                      src={generatePixQR()}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-gray-400 text-sm">
                    Escaneie o QR Code com seu app de banco
                  </p>
                </div>

                {/* PIX Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Código PIX Copia e Cola
                  </label>
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <code className="text-xs text-gray-300 break-all block mb-3">
                      {pixData.code}
                    </code>
                    <button
                      onClick={handleCopyPix}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors text-sm w-full justify-center"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{pixCopied ? 'Copiado!' : 'Copiar Código'}</span>
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-2">Como pagar:</h4>
                  <ol className="text-blue-300 text-sm space-y-1 list-decimal list-inside">
                    <li>Abra o app do seu banco</li>
                    <li>Escolha a opção PIX</li>
                    <li>Escaneie o QR Code ou cole o código</li>
                    <li>Confirme o pagamento</li>
                    <li>O pagamento será processado automaticamente</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPayments;