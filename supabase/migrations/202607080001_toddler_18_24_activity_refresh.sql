-- Refresh all development activities for an 18 to 24 month old.
-- Focus: self dependence, problem solving, balanced skills, and extra leg
-- strengthening for slightly underdeveloped gross motor. Each how_to lists
-- household materials and numbered steps so a nanny can follow it exactly.
-- Rows are updated in place (keyed by current name) to preserve daily_logs history.

-- Movement: biased to leg strength (squats, weight bearing, step ups, climbing).
update public.activities set
  name = 'Squat-and-drop tidy',
  category = 'Movement',
  skill_tags = array['Gross Motor', 'Balance', 'Independence'],
  how_to = 'Materials: a bucket and 8 to 10 toys scattered on the floor. 1) Place the bucket at her feet. 2) Point to a toy and ask her to squat down (bend knees, no sitting) to pick it up. 3) Stand back up and drop it in the bucket, then repeat for every toy. Cheer each stand-up as this builds leg strength.'
where name = 'Push toy walking';

update public.activities set
  name = 'Laundry-basket push',
  category = 'Movement',
  skill_tags = array['Gross Motor', 'Coordination', 'Balance'],
  how_to = 'Materials: an empty laundry basket and a few books. 1) Put 2 or 3 books in the basket for weight. 2) Have her grip both edges and push it across the room like a sled. 3) Add one more book and go again. Pushing weight strengthens her legs and core.'
where name = 'Stair climbing with hand hold';

update public.activities set
  name = 'Step up, step down',
  category = 'Movement',
  skill_tags = array['Gross Motor', 'Balance', 'Coordination'],
  how_to = 'Materials: a low sturdy step stool or a thick stack of books about 10 cm high. 1) Hold one or both of her hands. 2) Help her step up with one foot, then the other. 3) Step back down the same way and repeat 8 to 10 times. Keep it slow and steady.'
where name = 'Ball kick and chase';

update public.activities set
  name = 'Cushion mountain climb',
  category = 'Movement',
  skill_tags = array['Gross Motor', 'Balance', 'Problem Solving'],
  how_to = 'Materials: 3 or 4 sofa cushions or pillows. 1) Pile the cushions into a low, soft mound against a wall. 2) Encourage her to climb up and over using both hands and feet. 3) Rearrange the pile so she works out a new route each time. Stay right beside her.'
where name = 'Hide and seek';

update public.activities set
  name = 'Ball kick and chase',
  category = 'Movement',
  skill_tags = array['Gross Motor', 'Coordination', 'Attention'],
  how_to = 'Materials: any soft ball. 1) Roll the ball gently to her feet. 2) Show her how to kick it forward. 3) Let her chase it down and kick it again across the room.'
where name = 'Dance and action songs';

-- Fine Motor: pincer strength and problem solving.
update public.activities set
  name = 'Stack-and-topple towers',
  category = 'Fine Motor',
  skill_tags = array['Fine Motor', 'Coordination', 'Problem Solving'],
  how_to = 'Materials: blocks or stackable plastic cups. 1) Stack 2 or 3 together slowly. 2) Let her copy you and add more. 3) Count "1-2-3, fall!" and let her knock it down, then rebuild it together.'
where name = 'Stack blocks and towers';

update public.activities set
  name = 'Post the lids',
  category = 'Fine Motor',
  skill_tags = array['Fine Motor', 'Problem Solving', 'Independence'],
  how_to = 'Materials: a shoebox or tub with a coin-sized slot cut in the lid, plus bottle caps or small plastic lids. 1) Show her pushing one lid through the slot. 2) Hand her the caps one at a time to post herself. 3) Open the box to find them and start again. She works out how to line each cap up with the slot.'
where name = 'Drop objects in a container';

update public.activities set
  name = 'Spoon transfer',
  category = 'Fine Motor',
  skill_tags = array['Fine Motor', 'Independence', 'Coordination'],
  how_to = 'Materials: 2 bowls, a spoon, and dry pasta or beans. 1) Fill one bowl and place the empty one beside it. 2) Show her scooping with the spoon and moving pasta to the empty bowl. 3) Let her do it on her own; spills are fine. This builds the control she needs to self-feed.'
where name = 'Scribble with crayons';

update public.activities set
  name = 'Clothespin clip',
  category = 'Fine Motor',
  skill_tags = array['Fine Motor', 'Problem Solving', 'Attention'],
  how_to = 'Materials: clothespins and the rim of a bowl or a cardboard edge. 1) Show her pinching a clothespin open and clipping it on the rim. 2) Hand them over one at a time. 3) Let her pull them off and re-clip. This strengthens her pincer grip.'
where name = 'Simple puzzle with knobs';

update public.activities set
  name = 'Scribble with crayons',
  category = 'Fine Motor',
  skill_tags = array['Fine Motor', 'Coordination', 'Expressive Language'],
  how_to = 'Materials: large crayons and paper. 1) Sit her at the table with the paper. 2) Let her scribble freely while you name each color. 3) Ask her to make "big" marks and "small" marks.'
where name = 'Aim and drop game';

-- Language: receptive and expressive, with an independence thread.
update public.activities set
  name = 'Read board books',
  category = 'Language',
  skill_tags = array['Vocabulary', 'Receptive Language', 'Attention'],
  how_to = 'Materials: 1 or 2 board books. 1) Sit together and read slowly. 2) Point to the pictures and name them. 3) Pause on each page and let her point or say a word.'
where name = 'Read board books';

update public.activities set
  name = 'Chatter stretchers',
  category = 'Language',
  skill_tags = array['Expressive Language', 'Receptive Language', 'Vocabulary'],
  how_to = 'Materials: none. 1) When she says one word such as "milk", expand it into a short phrase such as "want milk". 2) Say the phrase back to her warmly. 3) Invite her to repeat it and accept any attempt.'
where name = 'Chatter stretchers';

update public.activities set
  name = 'Animal sounds',
  category = 'Language',
  skill_tags = array['Expressive Language', 'Vocabulary', 'Imitation'],
  how_to = 'Materials: none, or a picture book. 1) Name an animal and make its sound. 2) Pause and look at her expectantly. 3) Let her copy, then take turns choosing animals.'
where name = 'Animal sounds';

update public.activities set
  name = 'Help me fetch game',
  category = 'Language',
  skill_tags = array['Receptive Language', 'Independence', 'Attention'],
  how_to = 'Materials: everyday items around the room. 1) Give one simple instruction such as "bring your shoe" or "get the spoon". 2) Wait and let her find it herself. 3) Thank her and give the next task. This builds listening and self-reliance.'
where name = 'Help me game';

update public.activities set
  name = 'Name it in the kitchen',
  category = 'Language',
  skill_tags = array['Vocabulary', 'Receptive Language', 'Expressive Language'],
  how_to = 'Materials: safe kitchen items such as a spoon, cup, bowl, and banana. 1) Hold up one item and name it. 2) Ask "where is the cup?" and let her point to it. 3) Hand it to her and let her repeat the word.'
where name = 'What happened today?';

-- Sensory: problem solving and analytical lean.
update public.activities set
  name = 'Which cup hides it?',
  category = 'Sensory',
  skill_tags = array['Problem Solving', 'Attention', 'Receptive Language'],
  how_to = 'Materials: 2 opaque cups and a small toy. 1) Hide the toy under one cup while she watches. 2) Slowly swap the two cups around. 3) Ask "where is it?" and let her lift a cup to check. This builds tracking and reasoning.'
where name = 'Water dump and pour';

update public.activities set
  name = 'Lid-and-container match',
  category = 'Sensory',
  skill_tags = array['Problem Solving', 'Fine Motor', 'Attention'],
  how_to = 'Materials: 3 or 4 plastic containers with matching lids. 1) Lay out the containers and mix up the lids. 2) Show her matching one lid to its container. 3) Let her work out the rest by trying different lids.'
where name = 'Texture basket';

update public.activities set
  name = 'Water pour and transfer',
  category = 'Sensory',
  skill_tags = array['Sensory Integration', 'Fine Motor', 'Attention'],
  how_to = 'Materials: shallow water in a tray, 2 cups, and a small jug. 1) Sit her at the tray. 2) Show pouring water from cup to cup without spilling. 3) Let her pour back and forth and squeeze a sponge.'
where name = 'Treasure box surprise';

update public.activities set
  name = 'Texture basket',
  category = 'Sensory',
  skill_tags = array['Sensory Integration', 'Vocabulary', 'Attention'],
  how_to = 'Materials: a basket holding a cloth, sponge, wooden spoon, and soft brush. 1) Let her pull out one item at a time. 2) Name it and describe the feel such as "soft" or "rough". 3) Ask her to find the "soft one" so she sorts by feel.'
where name = 'Bubble chase and pop';

update public.activities set
  name = 'Treasure dig',
  category = 'Sensory',
  skill_tags = array['Problem Solving', 'Sensory Integration', 'Fine Motor'],
  how_to = 'Materials: a big bowl of dry pasta or rice (supervised closely) and 3 small hidden toys. 1) Bury the toys in the bowl. 2) Tell her how many to find. 3) Let her dig them out and count each one she pulls out.'
where name = 'Shell game with cups';

-- Social Emotional: self dependence lean.
-- Order note: rows whose current name is reused as another row's new name are
-- renamed first, so no WHERE ever matches two rows during this migration.
update public.activities set
  name = 'Self-feeding at mealtime',
  category = 'Social Emotional',
  skill_tags = array['Independence', 'Fine Motor', 'Coordination'],
  how_to = 'Materials: her spoon, a small open cup, and finger foods. 1) Preload the spoon and let her bring it to her own mouth. 2) Offer the open cup for a few sips. 3) Let her try scooping on her own and praise the effort, not the neatness.'
where name = 'Self-feeding at mealtime';

-- Rename the current 'Dressing helper' first so the name is free to reuse below.
update public.activities set
  name = 'Pretend care play',
  category = 'Social Emotional',
  skill_tags = array['Imitation', 'Expressive Language', 'Emotional Regulation'],
  how_to = 'Materials: a doll or stuffed toy, a spoon, and a cloth. 1) Show her "feeding" the doll with the spoon. 2) Narrate the actions such as "baby is eating" and "wipe baby''s mouth". 3) Let her take over the caring actions.'
where name = 'Dressing helper';

update public.activities set
  name = 'Dressing helper',
  category = 'Social Emotional',
  skill_tags = array['Independence', 'Receptive Language', 'Fine Motor'],
  how_to = 'Materials: her shirt, pants, socks, and shoes. 1) Lay the items out and name each one. 2) Ask her to hand you each piece in order. 3) Let her push an arm through a sleeve or pull off a sock herself.'
where name = 'Pretend feeding play';

-- Rename the current 'Independent play' first so the name is free to reuse below.
update public.activities set
  name = 'Clean-up sorting',
  category = 'Social Emotional',
  skill_tags = array['Independence', 'Problem Solving', 'Attention'],
  how_to = 'Materials: 2 bins and a mix of toys or socks. 1) Give one rule such as "blocks here, balls there" or "socks in this bin". 2) Hand her items one at a time to sort. 3) Cheer as each bin fills. This teaches order and self-reliance.'
where name = 'Independent play';

update public.activities set
  name = 'Independent play',
  category = 'Social Emotional',
  skill_tags = array['Independence', 'Attention', 'Emotional Regulation'],
  how_to = 'Materials: 2 or 3 safe toys. 1) Set the toys out and sit nearby but quiet. 2) Let her lead the play for about 10 minutes without directing her. 3) Step in only if she asks. This builds focus and independence.'
where name = 'Sort and clean up';
