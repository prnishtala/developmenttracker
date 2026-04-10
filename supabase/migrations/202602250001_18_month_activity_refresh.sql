update public.activities set
  name = 'Push toy walking',
  category = 'Movement',
  skill_tags = array['Gross Motor', 'Balance', 'Coordination'],
  how_to = 'Hold both hands or use a sturdy push toy and let toddler take a few steady steps forward.'
where name = 'Push toy walking';

update public.activities set
  name = 'Stair climbing with hand hold',
  category = 'Movement',
  skill_tags = array['Gross Motor', 'Balance', 'Coordination'],
  how_to = 'Hold one or both hands and help toddler climb 3 to 5 safe steps up and down slowly.'
where name = 'Couch cushion climbing';

update public.activities set
  name = 'Ball kick and chase',
  category = 'Movement',
  skill_tags = array['Gross Motor', 'Coordination', 'Attention'],
  how_to = 'Roll a soft ball, then help toddler kick it back and chase after it.'
where name = 'Ball rolling';

update public.activities set
  name = 'Hide and seek',
  category = 'Movement',
  skill_tags = array['Gross Motor', 'Attention', 'Emotional Regulation'],
  how_to = 'Hide behind a pillow or door and take turns finding each other.'
where name = 'Outdoor grass walking';

update public.activities set
  name = 'Stack blocks and towers',
  category = 'Fine Motor',
  skill_tags = array['Fine Motor', 'Coordination', 'Attention'],
  how_to = 'Show stacking 2 to 4 blocks and let toddler copy, then knock the tower down.'
where name = 'Stack blocks';

update public.activities set
  name = 'Drop objects in a container',
  category = 'Fine Motor',
  skill_tags = array['Fine Motor', 'Coordination', 'Attention'],
  how_to = 'Give a large container and let toddler drop safe objects one by one.'
where name = 'Drop objects in container';

update public.activities set
  name = 'Scribble with crayons',
  category = 'Fine Motor',
  skill_tags = array['Fine Motor', 'Coordination', 'Expressive Language'],
  how_to = 'Offer large crayons and paper and let toddler scribble while you name colors.'
where name = 'Scribble with crayon';

update public.activities set
  name = 'Self-feeding at mealtime',
  category = 'Social Emotional',
  skill_tags = array['Fine Motor', 'Independence', 'Coordination'],
  how_to = 'Encourage toddler to use spoon, finger foods, and a small cup during meals.'
where name = 'Finger food self feeding';

update public.activities set
  name = 'Read board books',
  category = 'Language',
  skill_tags = array['Vocabulary', 'Receptive Language', 'Attention'],
  how_to = 'Read 1 or 2 short board books, point to pictures, and pause for toddler to respond.'
where name = 'Read 2 board books';

update public.activities set
  name = 'Chatter stretchers',
  category = 'Language',
  skill_tags = array['Expressive Language', 'Receptive Language', 'Vocabulary'],
  how_to = 'Expand single words into a short phrase and invite toddler to repeat.'
where name = 'Object naming';

update public.activities set
  name = 'Animal sounds',
  category = 'Language',
  skill_tags = array['Expressive Language', 'Vocabulary', 'Receptive Language'],
  how_to = 'Make animal sounds and pause for toddler to copy them.'
where name = 'Animal sounds';

update public.activities set
  name = 'Help me game',
  category = 'Language',
  skill_tags = array['Receptive Language', 'Independence', 'Attention'],
  how_to = 'Give simple directions like bring diaper, get shoe, or hand me the book.'
where name = 'Body part identification';

update public.activities set
  name = 'What happened today?',
  category = 'Language',
  skill_tags = array['Expressive Language', 'Vocabulary', 'Attention'],
  how_to = 'After an outing, ask toddler to tell someone else what they saw or did.'
where name = 'Simple 1 step instruction game';

update public.activities set
  name = 'Water dump and pour',
  category = 'Sensory',
  skill_tags = array['Sensory Integration', 'Fine Motor', 'Attention'],
  how_to = 'Use cups, bowls, and squeezable toys in shallow water for pouring and splashing.'
where name = 'Water play';

update public.activities set
  name = 'Texture basket',
  category = 'Sensory',
  skill_tags = array['Sensory Integration', 'Attention', 'Vocabulary'],
  how_to = 'Offer safe textures like cloth, sponge, spoon, and leaf, then name each item.'
where name = 'Texture exploration';

update public.activities set
  name = 'Treasure box surprise',
  category = 'Sensory',
  skill_tags = array['Sensory Integration', 'Problem Solving', 'Attention'],
  how_to = 'Hide a toy under cups or in a clear box and let toddler find it.'
where name = 'Leaf exploration';

update public.activities set
  name = 'Pretend feeding play',
  category = 'Social Emotional',
  skill_tags = array['Emotional Regulation', 'Expressive Language', 'Imitation'],
  how_to = 'Let toddler feed a doll or stuffed toy and narrate the pretend actions.'
where name = 'Mirror play';

update public.activities set
  name = 'Independent play',
  category = 'Social Emotional',
  skill_tags = array['Independence', 'Attention', 'Emotional Regulation'],
  how_to = 'Set up safe toys and allow about 10 minutes of supervised independent play.'
where name = 'Independent play 10 minutes';

update public.activities set
  name = 'Sort and clean up',
  category = 'Social Emotional',
  skill_tags = array['Independence', 'Attention', 'Coordination'],
  how_to = 'Sort socks, blocks, or toys into piles and help put them back together.'
where name = 'Respond to name practice';

update public.activities set
  name = 'Dressing helper',
  category = 'Social Emotional',
  skill_tags = array['Independence', 'Receptive Language', 'Fine Motor'],
  how_to = 'Lay out shirt, pants, socks, and shoes and ask toddler to hand each item to you.'
where name = 'Gentle touch practice';

insert into public.activities (name, category, skill_tags, how_to)
values
  ('Dance and action songs', 'Movement', array['Gross Motor', 'Rhythm', 'Emotional Regulation'], 'Sing action songs and copy simple movements together for 5 minutes.'),
  ('Simple puzzle with knobs', 'Fine Motor', array['Fine Motor', 'Problem Solving', 'Attention'], 'Offer a 2 to 4 piece puzzle with knobs and help toddler match pieces.'),
  ('Aim and drop game', 'Fine Motor', array['Fine Motor', 'Coordination', 'Attention'], 'Let toddler drop clothespins, pasta, or soft items into a wide-mouthed container.'),
  ('Bubble chase and pop', 'Sensory', array['Sensory Integration', 'Gross Motor', 'Attention'], 'Blow bubbles and let toddler chase, pop, and try blowing back through a straw.'),
  ('Shell game with cups', 'Sensory', array['Problem Solving', 'Attention', 'Receptive Language'], 'Hide a small toy under one of two cups and ask toddler to find it.');
