
do $$
declare s uuid; l uuid; rec record; i int;
begin
for rec in select * from (values
 (1,'Português','📖','#e11d48','Classes de palavras','Substantivo, adjetivo, verbo e advérbio',
  E'As classes gramaticais organizam as palavras pela função que exercem.\n\n**Substantivo** nomeia seres e coisas (casa, Maria). **Adjetivo** caracteriza o substantivo (bonita, alto). **Verbo** indica ação, estado ou fenômeno (correr, ser, chover). **Advérbio** modifica verbo, adjetivo ou outro advérbio (muito, ontem, bem).\n\nDica: pergunte "o quê?" para achar substantivos e "como?" para advérbios de modo.',
  '[["Qual palavra é um substantivo?","Correr|Mesa|Rápido|Ontem",1],["Em \"menina alegre\", alegre é:","Verbo|Advérbio|Adjetivo|Pronome",2],["Qual é um verbo?","Cantar|Canção|Cantora|Cantado demais",0],["\"Ele chegou cedo.\" Cedo é:","Advérbio|Adjetivo|Substantivo|Artigo",0],["Plural de \"cidadão\":","Cidadões|Cidadães|Cidadãos|Cidadans",2],["Qual palavra está acentuada corretamente?","Juíz|Café|Hífem|Ítem",1],["Sinônimo de \"feliz\":","Triste|Contente|Cansado|Bravo",1],["Antônimo de \"alto\":","Grande|Baixo|Largo|Forte",1],["Qual é um artigo definido?","Um|Uma|O|Uns",2],["\"Nós estudamos.\" O sujeito é:","Estudamos|Nós|Oculto|Inexistente",1]]'),
 (2,'Matemática','➗','#2563eb','Operações e frações','Base de aritmética',
  E'Frações representam partes de um todo: o **numerador** (em cima) indica quantas partes pegamos e o **denominador** (embaixo) em quantas partes o todo foi dividido.\n\nPara somar frações com denominadores diferentes, use o MMC. Para multiplicar, multiplique numeradores e denominadores. Porcentagem é uma fração de denominador 100.',
  '[["Quanto é 7 × 8?","54|56|64|48",1],["1/2 + 1/4 =","2/6|3/4|1/8|2/4",1],["25% de 200 =","25|40|50|75",2],["Raiz quadrada de 81:","8|9|7|81",1],["Quanto é 2³?","6|8|9|5",1],["Se x + 5 = 12, x =","5|6|7|17",2],["Área de um quadrado de lado 4:","8|12|16|20",2],["0,5 em fração:","1/5|1/2|5/1|2/5",1],["MMC de 4 e 6:","2|10|12|24",2],["Quanto é 100 ÷ 4?","20|25|30|40",1]]'),
 (3,'Física','🧲','#7c3aed','Movimento e Leis de Newton','Cinemática e dinâmica básicas',
  E'**Velocidade média** = distância ÷ tempo. **Aceleração** é a variação da velocidade pelo tempo.\n\nLeis de Newton:\n1. Inércia: um corpo mantém seu estado de repouso ou movimento até que uma força atue.\n2. F = m · a.\n3. Ação e reação: toda ação gera uma reação de mesma intensidade e sentido oposto.',
  '[["Unidade de força no SI:","Joule|Watt|Newton|Pascal",2],["Carro percorre 100 km em 2 h. Velocidade média:","25 km/h|50 km/h|100 km/h|200 km/h",1],["F = m·a é a:","1ª Lei|2ª Lei|3ª Lei|Lei da gravitação",1],["Inércia é a tendência de:","Acelerar|Manter o estado de movimento|Cair|Esquentar",1],["Massa 2 kg, aceleração 3 m/s². Força:","5 N|6 N|1,5 N|9 N",1],["Gravidade aproximada na Terra:","1 m/s²|5 m/s²|9,8 m/s²|20 m/s²",2],["Ação e reação é a:","1ª Lei|2ª Lei|3ª Lei|Nenhuma",2],["Unidade de energia:","Newton|Joule|Metro|Volt",1],["Velocidade da luz no vácuo ≈","300 km/s|3.000 km/s|300.000 km/s|3 milhões km/s",2],["Unidade de tempo no SI:","Minuto|Hora|Segundo|Dia",2]]'),
 (4,'Química','⚗️','#059669','Átomos e tabela periódica','Estrutura atômica',
  E'O átomo possui **prótons** (carga +) e **nêutrons** (sem carga) no núcleo, e **elétrons** (carga −) na eletrosfera.\n\nO **número atômico (Z)** é o número de prótons e identifica o elemento. A tabela periódica organiza os elementos por Z crescente; colunas são **famílias** e linhas são **períodos**.',
  '[["Partícula de carga negativa:","Próton|Nêutron|Elétron|Núcleo",2],["Símbolo do oxigênio:","Ox|O|Og|Oi",1],["Fórmula da água:","CO2|H2O|O2|NaCl",1],["Número atômico indica:","Nº de nêutrons|Nº de prótons|Massa|Nº de moléculas",1],["Símbolo do sódio:","S|So|Na|Sd",2],["pH 7 é:","Ácido|Básico|Neutro|Salino",2],["Gás nobre:","Oxigênio|Hélio|Nitrogênio|Hidrogênio",1],["NaCl é o:","Açúcar|Sal de cozinha|Bicarbonato|Vinagre",1],["Linhas da tabela periódica são:","Famílias|Grupos|Períodos|Colunas",2],["Símbolo do ferro:","F|Fe|Fr|Ir",1]]'),
 (5,'Inglês','🇬🇧','#ea580c','Verb to be e vocabulário','Presente simples',
  E'O **verb to be** significa ser/estar:\n- I **am**\n- You/We/They **are**\n- He/She/It **is**\n\nNegativa: acrescente **not** (I am not). Interrogativa: inverta (Are you ready?).',
  '[["She ___ a teacher.","am|is|are|be",1],["They ___ happy.","is|am|are|be",2],["Tradução de \"book\":","Livro|Mesa|Caderno|Caneta",0],["Plural de \"child\":","Childs|Children|Childes|Childrens",1],["\"I am not\" é a forma:","Afirmativa|Negativa|Interrogativa|Passada",1],["Oposto de \"hot\":","Warm|Cold|Big|Fast",1],["\"Good morning\" significa:","Boa noite|Boa tarde|Bom dia|Tchau",2],["Passado de \"go\":","Goed|Went|Gone|Going",1],["\"Apple\" é:","Banana|Maçã|Uva|Pera",1],["Qual é um dia da semana?","January|Monday|Summer|Morning",1]]')
) as t(pos,name,icon,color,title,caption,theory,qs) loop
  insert into public.subjects(name,icon,color,position) values (rec.name,rec.icon,rec.color,rec.pos) returning id into s;
  insert into public.lessons(subject_id,title,caption,theory,position) values (s,rec.title,rec.caption,rec.theory,1) returning id into l;
  for i in 0..9 loop
    insert into public.questions(lesson_id,prompt,options,correct_index,position) values (l,
      (rec.qs::jsonb)->i->>0,
      to_jsonb(string_to_array((rec.qs::jsonb)->i->>1,'|')),
      ((rec.qs::jsonb)->i->>2)::int, i+1);
  end loop;
end loop;
end $$;
