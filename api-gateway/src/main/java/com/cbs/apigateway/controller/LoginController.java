package com.cbs.apigateway.controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.reactive.result.view.RedirectView;

//@CrossOrigin(
  //      origins = "http://localhost:8082",
   //     allowedHeaders = {"x-auth-token", "x-requested-with", "x-xsrf-token"}
//)
@Controller
public class LoginController {
	
	//@Autowired
	//private AuthenticationManager authenticationManager;

	@GetMapping("/logged-out")
	public RedirectView logout() {
		RedirectView redirectView = new RedirectView();
	    redirectView.setUrl("/");
	    return redirectView;
	}
	/*
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody SigninRequest request)  {

		request.getUsername(); 
		request.getPassword();
		JwtAuthenticationResponse response=new JwtAuthenticationResponse();
		response.setToken("token");
		
		return ResponseEntity.ok(response);
	}*/
}