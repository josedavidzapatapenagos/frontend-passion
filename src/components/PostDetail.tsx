import { useEffect, useState } from 'react';
import { getPostById, type PostDetail } from '../services/postService';

export const PostDetailView = ({ postId }: { postId: string }) => {
  const [post, setPost] = useState<PostDetail | null>(null);

  useEffect(() => {
    if (postId) {
      getPostById(postId).then(setPost);
    }
  }, [postId]);

  if (!post) return <div className="p-20 text-center text-[#FD0083] font-black animate-pulse">CARGANDO...</div>;

  // Buscamos el WhatsApp en los métodos de contacto
  const whatsapp = post.modelContactMethods.find(m => m.app === 'WHATSAPP')?.value;

  return (
    <div className="px-16 w-full text-left bg-white pb-12">
      <div className="flex justify-between items-start mb-10">
        <div className="space-y-8">
          {/* Sección de Servicios */}
          <div>
            <h4 className="text-[#012a33] font-black text-xl mb-4 uppercase italic">Servicios Virtuales</h4>
            <div className="flex flex-wrap gap-2">
              {post.services.map(service => (
                <span key={service} className="bg-[#012a33] text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest">
                  {service.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Botón LLAMAME estilo WhatsApp oficial */}
        <a 
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25D366] hover:bg-[#20ba5a] hover:scale-105 transition-all text-white px-10 py-5 rounded-full font-black text-2xl flex items-center gap-4 shadow-[0_15px_30px_rgba(37,211,102,0.4)]"
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
            className="w-10 h-10" 
            alt="WhatsApp Icon" 
          />
          LLAMAME...
        </a>
      </div>

      {/* Galería de fotos GIGANTES alineada a la izquierda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {post.modelContents.map((content) => (
          <div key={content.id} className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-gray-100">
            {content.contentType === 'VIDEO' ? (
              <video 
                src={content.contentUrl} 
                className="w-full h-full object-cover" 
                controls 
              />
            ) : (
              <img 
                src={content.contentUrl} 
                className="w-full h-full object-cover" 
                alt="Model Content" 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};