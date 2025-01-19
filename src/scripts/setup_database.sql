-- Criar a tabela de usuários
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    birth_date DATE,
    cpf TEXT,
    rg TEXT,
    religion TEXT,
    unit TEXT,
    is_active BOOLEAN DEFAULT true,
    is_founder BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    development_start_date DATE,
    internship_start_date DATE,
    magista_initiation_date DATE,
    not_entry_date DATE,
    master_mage_initiation_date DATE,
    photo_url TEXT,
    inactive_since DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Users can view own user data." ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data." ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can do anything." ON public.users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Enable insert for admins" ON public.users FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Criar função para atualizar o timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o timestamp
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Criar usuário admin
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_sent_at,
    confirmed_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '878848d5-781b-4be8-843c-496bd24bd654',
    'authenticated',
    'authenticated',
    'paularacy@gmail.com',
    crypt('adm@123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Paula Racy","is_admin":true}'::jsonb,
    NOW(),
    NOW(),
    NOW(),
    NOW()
);

-- Inserir usuário na tabela public
INSERT INTO public.users (
    id,
    email,
    full_name,
    is_admin,
    is_active
)
VALUES (
    '878848d5-781b-4be8-843c-496bd24bd654',
    'paularacy@gmail.com',
    'Paula Racy',
    true,
    true
);

-- Criar bucket para fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Criar política de acesso para o bucket de fotos
CREATE POLICY "Anyone can read photos" ON storage.objects FOR SELECT
    USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'photos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE
    USING (
        bucket_id = 'photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
