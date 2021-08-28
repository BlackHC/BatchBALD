store = {}
store['args']={'num_inference_samples': 100, 'available_sample_k': 40, 'seed': 920188, 'type': 'AcquisitionFunction.bald', 'acquisition_method': 'AcquisitionMethod.multibald', 'experiment_description': 'Additional paper experiments (#1): RMNIST w/ noise, MNIST w/ noise, MNIST, with initial samples', 'batch_size': 64, 'scoring_batch_size': 512, 'test_batch_size': 512, 'validation_set_size': 1024, 'early_stopping_patience': 3, 'epochs': 30, 'epoch_samples': 5056, 'target_accuracy': 0.96, 'target_num_acquired_samples': 300, 'log_interval': 20, 'min_remaining_percentage': 100, 'min_candidates_per_acquired_item': 20, 'dataset': 'DatasetEnum.mnist', 'initial_samples': [38043, 40091, 17418, 2094, 39879, 3133, 5011, 40683, 54379, 24287, 9849, 59305, 39508, 39356, 8758, 52579, 13655, 7636, 21562, 41329], 'experiment_task_id': 'mnist_multibald_bald_k100_b40_920188', 'experiments_laaos': './experiment_configs/paper_exp1/configs.py', 'no_cuda': False, 'quickquick': False, 'initial_samples_per_class': 2, 'initial_percentage': 100, 'reduce_percentage': 0}
store['cmdline']=['./src/ignite_mnist.py', '--experiment_task_id=mnist_multibald_bald_k100_b40_920188', '--experiments_laaos=./experiment_configs/paper_exp1/configs.py']
store['iterations']=[]
store['initial_samples']=[38043, 40091, 17418, 2094, 39879, 3133, 5011, 40683, 54379, 24287, 9849, 59305, 39508, 39356, 8758, 52579, 13655, 7636, 21562, 41329]
store['iterations'].append({'num_epochs': 6, 'test_metrics': {'accuracy': 0.6517, 'nll': 3.4685021919720778}, 'chosen_samples': [25341, 30932, 3801, 44455, 3795, 59106, 30798, 1324, 51922, 5088, 33169, 5155, 44013, 20595, 29852, 28258, 45917, 6231, 33099, 39818, 51976, 27328, 34011, 53868, 58405, 29390, 59368, 29001, 11586, 3073, 23108, 45146, 7012, 38411, 37720, 22144, 59244, 6045, 49603, 39510], 'chosen_samples_score': [1.2988883726005995, 2.3915639017272072, 3.2128709369770485, 3.796943631949612, 4.13717897777007, 4.358361492125866, 4.473295428571696, 4.509788667315383, 4.532716474663531, 4.5716615276566195, 4.604603784919267, 4.6404050783556, 4.599375180602834, 4.566491223509672, 4.630057074774977, 4.576792260696216, 4.608665904866422, 4.634457013500725, 4.6161498902804645, 4.613250009967777, 4.588354908755708, 4.621283020831029, 4.650794152229135, 4.636754962206554, 4.585757228227431, 4.5433476408436615, 4.606239995244376, 4.589523188942236, 4.650627963728793, 4.6677353699644915, 4.6082169824180355, 4.592017106669154, 4.594978504828031, 4.596137332531516, 4.602533215639294, 4.58477571035915, 4.555990329407205, 4.587166070338611, 4.580813476596727, 4.616452167256558], 'chosen_samples_orignal_score': None, 'train_model_elapsed_time': 31.159931506001158, 'batch_acquisition_elapsed_time': 190.03622810399975})
store['iterations'].append({'num_epochs': 6, 'test_metrics': {'accuracy': 0.8282, 'nll': 1.2996520943159464}, 'chosen_samples': [22092, 40505, 2000, 41140, 24221, 42891, 37271, 57956, 23041, 5173, 50891, 33572, 36783, 15292, 3140, 19942, 26132, 46600, 5032, 30123, 12645, 30011, 14174, 16978, 31396, 49463, 50705, 39224, 44226, 1661, 11402, 31914, 2709, 59346, 41286, 43205, 50673, 43641, 1511, 119], 'chosen_samples_score': [1.234233945057127, 2.2687431781228993, 3.1116292776784453, 3.7223641082549226, 4.094713295117149, 4.300888371283886, 4.432491772031041, 4.542426337797864, 4.55257558540837, 4.542818667654942, 4.55734744896258, 4.617239289582733, 4.631633732948818, 4.651621641752998, 4.601347168104146, 4.63031484876001, 4.6071188030349415, 4.592481301813418, 4.632131293572153, 4.611363232770417, 4.674030521057732, 4.640272629344842, 4.59130989842847, 4.567880435181348, 4.5776013621717375, 4.6069889439724125, 4.576273918094614, 4.672688180130756, 4.5869387336771155, 4.4962629613283625, 4.566713100277866, 4.639622649984538, 4.57413138844074, 4.469699454827751, 4.590338335520581, 4.628757177379228, 4.6190144653557255, 4.581731018413503, 4.574643498895735, 4.573125710818413], 'chosen_samples_orignal_score': None, 'train_model_elapsed_time': 27.58407455899942, 'batch_acquisition_elapsed_time': 189.49717921499905})
store['iterations'].append({'num_epochs': 8, 'test_metrics': {'accuracy': 0.8602, 'nll': 1.055315114385486}, 'chosen_samples': [59314, 28525, 45048, 49425, 42477, 38298, 16210, 37305, 34020, 34428, 7891, 46163, 12767, 29803, 28775, 59447, 46383, 28299, 27673, 48681, 10979, 14669, 6424, 629, 15364, 40158, 10718, 28458, 440, 57278, 34501, 17603, 45780, 16839, 4168, 22318, 51532, 37566, 50398, 52095], 'chosen_samples_score': [1.2268806434954975, 2.346416008857434, 3.1935945639675842, 3.787231699123561, 4.161026776156443, 4.389473724082891, 4.431189167280133, 4.513594264828429, 4.582738699561631, 4.592575033201491, 4.531111405422673, 4.623974754269712, 4.600634309204332, 4.586336804156911, 4.573857454198643, 4.634599959833444, 4.6078115598253735, 4.56569163666482, 4.62272914586781, 4.5769365778100894, 4.637218975893379, 4.607616145940149, 4.60438694790324, 4.68881633274405, 4.577765720327617, 4.587631424444199, 4.54838777756898, 4.750115216766112, 4.628095555192914, 4.671212890557349, 4.5455656879902655, 4.612362268931715, 4.645339916164815, 4.575399629745295, 4.655505711139146, 4.674304871325539, 4.584734953842457, 4.621488126409513, 4.6368350632509205, 4.657319722115709], 'chosen_samples_orignal_score': None, 'train_model_elapsed_time': 33.54834856399975, 'batch_acquisition_elapsed_time': 189.45064712800013})
store['iterations'].append({'num_epochs': 8, 'test_metrics': {'accuracy': 0.8943, 'nll': 0.7540699707053898}, 'chosen_samples': [57311, 8116, 19855, 26444, 36417, 16332, 45047, 26534, 46187, 9948, 12196, 32507, 21692, 10070, 32421, 24887, 47936, 50418, 11572, 40259, 53732, 56673, 46529, 15932, 5770, 36604, 51283, 38698, 4545, 28712, 36946, 5015, 45474, 46619, 54684, 47130, 51759, 58314, 36545, 54492], 'chosen_samples_score': [1.1071962264777453, 2.123266580809853, 2.966909632325259, 3.5809586055914373, 3.988003362849731, 4.251656362736772, 4.4138799449376425, 4.519152826748534, 4.547983491516567, 4.560318792614217, 4.593867712074987, 4.616705452257558, 4.5747614884112835, 4.611842806597838, 4.646378172412444, 4.601042345159556, 4.618025057223253, 4.597960229614188, 4.571135824368758, 4.6120807550806, 4.584130992283905, 4.5999392242639345, 4.643605190064074, 4.552342351808633, 4.556404730181384, 4.60469482935625, 4.589417369029558, 4.641599633661931, 4.626987925365807, 4.698768104966707, 4.582656508431317, 4.556907066756043, 4.595497955377297, 4.624058069462002, 4.650727939050789, 4.643260585407724, 4.586143517319925, 4.625521646183017, 4.5982799611904746, 4.647081400190167], 'chosen_samples_orignal_score': None, 'train_model_elapsed_time': 34.53632540899707, 'batch_acquisition_elapsed_time': 190.42843209199782})
store['iterations'].append({'num_epochs': 10, 'test_metrics': {'accuracy': 0.9333, 'nll': 0.5715910718787313}, 'chosen_samples': [47870, 42787, 49537, 24533, 20859, 46412, 31845, 21436, 50572, 670, 37048, 40593, 224, 9118, 27203, 50370, 58384, 11693, 45502, 26693, 20434, 52528, 28279, 31310, 47475, 1016, 25634, 17082, 49222, 31794, 58503, 5467, 15850, 24570, 38636, 16646, 6489, 59860, 25820, 55400], 'chosen_samples_score': [1.1389044283868097, 2.2163377021159683, 3.069910014647304, 3.686708704044584, 4.083985424963911, 4.3000666751260646, 4.440075043720884, 4.521417447849302, 4.529775176076966, 4.566895609295427, 4.610109433702573, 4.583125497280649, 4.654162285897712, 4.582060417959143, 4.605700763498335, 4.5917466325847816, 4.658374612392761, 4.599407896585898, 4.566123397863716, 4.559981498712135, 4.648994792929132, 4.655919846730287, 4.636512637085579, 4.558167086466833, 4.6474883111293845, 4.591705222872067, 4.629465990298048, 4.547087644075836, 4.609340824087781, 4.5937590621184015, 4.564928955689176, 4.624456708476966, 4.596292492135998, 4.594540170654266, 4.649409457151549, 4.653507427746696, 4.659627764663906, 4.616350095330848, 4.561912214927176, 4.564716424552998], 'chosen_samples_orignal_score': None, 'train_model_elapsed_time': 41.03527800599841, 'batch_acquisition_elapsed_time': 190.552928967998})
store['iterations'].append({'num_epochs': 11, 'test_metrics': {'accuracy': 0.9442, 'nll': 0.4857132443064452}, 'chosen_samples': [9180, 22497, 52294, 6428, 27169, 3030, 32702, 52914, 34707, 38256, 53854, 43575, 4153, 17079, 37696, 43207, 32427, 48355, 49656, 48040, 41491, 26134, 53910, 30962, 23884, 31777, 34676, 11710, 53156, 40029, 19298, 23940, 57154, 24989, 54000, 25947, 22723, 40686, 5978, 21306], 'chosen_samples_score': [1.2108261209603448, 2.2919615064283514, 3.1466152640286484, 3.734489704422063, 4.114802028723521, 4.333291985440637, 4.472667171037036, 4.545157866023466, 4.586098043627116, 4.612996321355892, 4.615225440723648, 4.6327463974791225, 4.611948220937026, 4.560334523692808, 4.595952189514504, 4.654229462010605, 4.59109934761614, 4.550652778457845, 4.597808325016832, 4.569274495855291, 4.64332803559682, 4.594576491779458, 4.596043012159075, 4.584183113020099, 4.597650659040486, 4.613478876437599, 4.6078007439364566, 4.573395258631255, 4.629999266016021, 4.5225798568758115, 4.600563778896987, 4.558607692038343, 4.639289946657183, 4.630970823442091, 4.652056841880206, 4.641221332645676, 4.630645866139904, 4.578816542519284, 4.546521378295438, 4.618083557972735], 'chosen_samples_orignal_score': None, 'train_model_elapsed_time': 43.787905835000856, 'batch_acquisition_elapsed_time': 191.2188523199984})
store['iterations'].append({'num_epochs': 7, 'test_metrics': {'accuracy': 0.9384, 'nll': 0.4571915876275897}, 'chosen_samples': [16692, 207, 1239, 18003, 33812, 21174, 58471, 59726, 12782, 57718, 44143, 14295, 23434, 14650, 8093, 39561, 15767, 16628, 32776, 9625, 13093, 28587, 37214, 43198, 17213, 40976, 5167, 18720, 57256, 55274, 45392, 21135, 6639, 11534, 53046, 27043, 34475, 24531, 52375, 37917], 'chosen_samples_score': [0.9915380942512881, 1.8928495817460984, 2.6605576268878117, 3.2980277069255406, 3.7750104956655814, 4.048750136662486, 4.274114669743787, 4.401925777810694, 4.470256928876747, 4.533707033324833, 4.537258368075861, 4.586120145206914, 4.5623825876723085, 4.606684220782865, 4.618484290866951, 4.583677147190519, 4.581483373595852, 4.60225800555526, 4.567566434814863, 4.618397594248343, 4.582144477149502, 4.524213508796105, 4.536708853320572, 4.641398893640893, 4.6149135149726455, 4.616334006558514, 4.65954027315766, 4.697135167414416, 4.5313446383489655, 4.6257075044952245, 4.62825020742045, 4.68667798806295, 4.570809379410168, 4.577337413082166, 4.64977829500377, 4.582219291108629, 4.730516747738502, 4.536277235199869, 4.597622624702275, 4.590779706506723], 'chosen_samples_orignal_score': None, 'train_model_elapsed_time': 32.29761280900129, 'batch_acquisition_elapsed_time': 189.83082122300038})
store['iterations'].append({'num_epochs': 14, 'test_metrics': {'accuracy': 0.9503, 'nll': 0.4229370747976303}, 'chosen_samples': [11007, 20172, 31308, 42337, 36818, 48384, 15494, 2426, 47220, 27514, 31345, 51652, 6474, 134, 5868, 33145, 51394, 8120, 32880, 37588, 56001, 27265, 770, 55735, 43088, 19034, 40066, 47688, 8390, 40539, 36768, 54440, 51558, 25577, 52410, 25433, 33951, 14490, 56609, 52024], 'chosen_samples_score': [1.1121847136258594, 2.14980677611042, 3.011091147333166, 3.6634426430387617, 4.09280753094629, 4.340609797090041, 4.456702144459086, 4.525658564203911, 4.597894939291852, 4.615400923136832, 4.637625526278291, 4.627048398964394, 4.63900773486692, 4.635730171692373, 4.596238307171877, 4.648304720028008, 4.599687677451604, 4.62568433048626, 4.572594597826107, 4.605273687700269, 4.624760509094962, 4.58250016426444, 4.637127954400828, 4.589077838846892, 4.597386870418015, 4.661008190349243, 4.660153614526568, 4.644374020555961, 4.544136406373507, 4.585071313890003, 4.6021862921238945, 4.627939079351327, 4.672926935119509, 4.591943364988865, 4.612887707288538, 4.5332271374385655, 4.578615523218694, 4.6006383873147865, 4.599579445996287, 4.606193894253217], 'chosen_samples_orignal_score': None, 'train_model_elapsed_time': 51.239847766999446, 'batch_acquisition_elapsed_time': 189.35632136300046})